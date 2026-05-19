import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BillItem {
  id: string;
  bill_id: string;
  name: string;
  quantity: number;
  rate: number;
  amount: number;
  created_at: string;
}

export interface ItemAssignment {
  id: string;
  item_id: string;
  member_id: string;
  share_amount: number;
  consumed_quantity: number;
  created_at: string;
}

export interface BillItemWithAssignments extends BillItem {
  assignments: ItemAssignment[];
}

// Fetch bill items for a specific bill
export const useBillItems = (billId: string) => {
  return useQuery({
    queryKey: ['bill-items', billId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settlegara_bill_items')
        .select('*')
        .eq('bill_id', billId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as BillItem[];
    },
    enabled: !!billId,
  });
};

// Fetch item assignments for a specific bill (all items)
export const useBillItemAssignments = (billId: string) => {
  return useQuery({
    queryKey: ['bill-item-assignments', billId],
    queryFn: async () => {
      // First get all items for this bill
      const { data: items, error: itemsError } = await supabase
        .from('settlegara_bill_items')
        .select('id')
        .eq('bill_id', billId);

      if (itemsError) throw itemsError;
      if (!items || items.length === 0) return [];

      const itemIds = items.map(item => item.id);

      // Then get all assignments for these items
      const { data: assignments, error: assignmentsError } = await supabase
        .from('settlegara_item_assignments')
        .select('*')
        .in('item_id', itemIds);

      if (assignmentsError) throw assignmentsError;
      return assignments as ItemAssignment[];
    },
    enabled: !!billId,
  });
};

// Fetch bill items with their assignments combined
export const useBillItemsWithAssignments = (billId: string) => {
  return useQuery({
    queryKey: ['bill-items-with-assignments', billId],
    queryFn: async () => {
      // Get all items for this bill
      const { data: items, error: itemsError } = await supabase
        .from('settlegara_bill_items')
        .select('*')
        .eq('bill_id', billId)
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;
      if (!items || items.length === 0) return [];

      const itemIds = items.map(item => item.id);

      // Get all assignments for these items
      const { data: assignments, error: assignmentsError } = await supabase
        .from('settlegara_item_assignments')
        .select('*')
        .in('item_id', itemIds);

      if (assignmentsError) throw assignmentsError;

      // Combine items with their assignments
      const itemsWithAssignments: BillItemWithAssignments[] = items.map(item => ({
        ...item,
        assignments: (assignments || []).filter(a => a.item_id === item.id)
      }));

      return itemsWithAssignments;
    },
    enabled: !!billId,
  });
};

// Create bill items with assignments
export const useCreateBillItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      billId, 
      items 
    }: { 
      billId: string; 
      items: Array<{
        name: string;
        quantity: number;
        rate: number;
        amount: number;
        memberQuantities: Record<string, number>;
      }>;
    }) => {
      // Insert all items
      const itemsToInsert = items.map(item => ({
        bill_id: billId,
        name: item.name,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      }));

      const { data: insertedItems, error: itemsError } = await supabase
        .from('settlegara_bill_items')
        .insert(itemsToInsert)
        .select();

      if (itemsError) throw itemsError;
      if (!insertedItems) throw new Error('Failed to insert items');

      // Create assignments for each item
      const assignmentsToInsert: Array<{
        item_id: string;
        member_id: string;
        share_amount: number;
        consumed_quantity: number;
      }> = [];

      insertedItems.forEach((insertedItem, index) => {
        const originalItem = items[index];
        const assignedMembers = Object.entries(originalItem.memberQuantities)
          .filter(([, consumedQuantity]) => consumedQuantity > 0);
        const perUnitRate = Number(insertedItem.quantity || 0) > 0
          ? Number(insertedItem.amount || 0) / Number(insertedItem.quantity || 0)
          : 0;

        if (assignedMembers.length > 0) {
          assignedMembers.forEach(([memberId, consumedQuantity]) => {
            assignmentsToInsert.push({
              item_id: insertedItem.id,
              member_id: memberId,
              share_amount: Math.round(perUnitRate * consumedQuantity * 100) / 100,
              consumed_quantity: consumedQuantity,
            });
          });
        }
      });

      if (assignmentsToInsert.length > 0) {
        const { error: assignmentsError } = await supabase
          .from('settlegara_item_assignments')
          .insert(assignmentsToInsert as any);

        if (assignmentsError) throw assignmentsError;
      }

      return insertedItems;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bill-items', variables.billId] });
      queryClient.invalidateQueries({ queryKey: ['bill-item-assignments', variables.billId] });
      queryClient.invalidateQueries({ queryKey: ['bill-items-with-assignments', variables.billId] });
      queryClient.invalidateQueries({ queryKey: ['member-items-breakdown', variables.billId] });
    },
  });
};

// Update bill items (delete old and insert new)
export const useUpdateBillItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      billId, 
      items 
    }: { 
      billId: string; 
      items: Array<{
        name: string;
        quantity: number;
        rate: number;
        amount: number;
        memberQuantities: Record<string, number>;
      }>;
    }) => {
      // First, get existing items to delete their assignments
      const { data: existingItems } = await supabase
        .from('settlegara_bill_items')
        .select('id')
        .eq('bill_id', billId);

      if (existingItems && existingItems.length > 0) {
        const existingItemIds = existingItems.map(item => item.id);
        
        // Delete old assignments
        await supabase
          .from('settlegara_item_assignments')
          .delete()
          .in('item_id', existingItemIds);
        
        // Delete old items
        await supabase
          .from('settlegara_bill_items')
          .delete()
          .eq('bill_id', billId);
      }

      if (items.length === 0) return [];

      // Insert all new items
      const itemsToInsert = items.map(item => ({
        bill_id: billId,
        name: item.name,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      }));

      const { data: insertedItems, error: itemsError } = await supabase
        .from('settlegara_bill_items')
        .insert(itemsToInsert)
        .select();

      if (itemsError) throw itemsError;
      if (!insertedItems) throw new Error('Failed to insert items');

      // Create assignments for each item
      const assignmentsToInsert: Array<{
        item_id: string;
        member_id: string;
        share_amount: number;
        consumed_quantity: number;
      }> = [];

      insertedItems.forEach((insertedItem, index) => {
        const originalItem = items[index];
        const assignedMembers = Object.entries(originalItem.memberQuantities)
          .filter(([, consumedQuantity]) => consumedQuantity > 0);
        const perUnitRate = Number(insertedItem.quantity || 0) > 0
          ? Number(insertedItem.amount || 0) / Number(insertedItem.quantity || 0)
          : 0;

        if (assignedMembers.length > 0) {
          assignedMembers.forEach(([memberId, consumedQuantity]) => {
            assignmentsToInsert.push({
              item_id: insertedItem.id,
              member_id: memberId,
              share_amount: Math.round(perUnitRate * consumedQuantity * 100) / 100,
              consumed_quantity: consumedQuantity,
            });
          });
        }
      });

      if (assignmentsToInsert.length > 0) {
        const { error: assignmentsError } = await supabase
          .from('settlegara_item_assignments')
          .insert(assignmentsToInsert as any);

        if (assignmentsError) throw assignmentsError;
      }

      return insertedItems;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bill-items', variables.billId] });
      queryClient.invalidateQueries({ queryKey: ['bill-item-assignments', variables.billId] });
      queryClient.invalidateQueries({ queryKey: ['bill-items-with-assignments', variables.billId] });
      queryClient.invalidateQueries({ queryKey: ['member-items-breakdown', variables.billId] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });
};

// Get items breakdown per member for a bill
export const useMemberItemsBreakdown = (billId: string) => {
  return useQuery({
    queryKey: ['member-items-breakdown', billId],
    queryFn: async () => {
      // Get all items for this bill
      const { data: items, error: itemsError } = await supabase
        .from('settlegara_bill_items')
        .select('*')
        .eq('bill_id', billId)
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;
      if (!items || items.length === 0) return {};

      const itemIds = items.map(item => item.id);

      // Get all assignments for these items
      const { data: assignments, error: assignmentsError } = await supabase
        .from('settlegara_item_assignments')
        .select('*')
        .in('item_id', itemIds);

      if (assignmentsError) throw assignmentsError;

      // Group by member
      const memberBreakdown: Record<string, Array<{
        item: BillItem;
        shareAmount: number;
        sharedWith: number;
      }>> = {};

      (assignments || []).forEach(assignment => {
        const item = items.find(i => i.id === assignment.item_id);
        if (!item) return;

        // Count how many members share this item
        const sharedWith = (assignments || []).filter(a => a.item_id === assignment.item_id).length;

        if (!memberBreakdown[assignment.member_id]) {
          memberBreakdown[assignment.member_id] = [];
        }

        memberBreakdown[assignment.member_id].push({
          item,
          shareAmount: assignment.share_amount,
          sharedWith,
        });
      });

      return memberBreakdown;
    },
    enabled: !!billId,
  });
};


export interface NetworkBillItemRow {
  bill_id: string;
  bill_title: string;
  item_id: string;
  item_name: string;
  quantity: number;
  rate: number;
  amount: number;
  member_id: string | null;
  member_name: string;
  consumed_quantity: number;
  share_amount: number;
  bill_discount_amount: number;
  bill_discount_excluded_members: string[];
  created_at: string;
}

// Get all bill items in a network with assignment/member details
export const useNetworkBillItems = (networkId: string) => {
  return useQuery({
    queryKey: ['network-bill-items', networkId],
    queryFn: async () => {
      const { data: bills, error: billsError } = await supabase
        .from('settlegara_bills')
        .select('id, title, discount_amount, discount_excluded_members')
        .eq('network_id', networkId)
        .eq('source_app', 'settlebill');

      if (billsError) throw billsError;
      if (!bills || bills.length === 0) return [] as NetworkBillItemRow[];

      const billIds = bills.map((bill) => bill.id);
      const billMap = new Map(bills.map((bill) => [bill.id, bill.title || 'Untitled Bill']));
      const billDiscountMap = new Map(bills.map((bill) => [bill.id, Number(bill.discount_amount || 0)]));
      const billDiscountExcludedMap = new Map(bills.map((bill) => [bill.id, (bill as any).discount_excluded_members || []]));

      const { data: items, error: itemsError } = await supabase
        .from('settlegara_bill_items')
        .select('*')
        .in('bill_id', billIds)
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;
      if (!items || items.length === 0) return [] as NetworkBillItemRow[];

      const itemIds = items.map((item) => item.id);

      const { data: assignments, error: assignmentsError } = await supabase
        .from('settlegara_item_assignments')
        .select('*')
        .in('item_id', itemIds);

      if (assignmentsError) throw assignmentsError;

      const { data: members, error: membersError } = await supabase
        .from('settlegara_network_members')
        .select('id, user_name')
        .eq('network_id', networkId);

      if (membersError) throw membersError;

      const memberMap = new Map((members || []).map((member) => [member.id, member.user_name]));
      const assignmentsByItem = new Map<string, typeof assignments>();

      (assignments || []).forEach((assignment) => {
        const list = assignmentsByItem.get(assignment.item_id) || [];
        list.push(assignment);
        assignmentsByItem.set(assignment.item_id, list);
      });

      const rows: NetworkBillItemRow[] = [];

      items.forEach((item) => {
        const itemAssignments = assignmentsByItem.get(item.id) || [];

        if (itemAssignments.length === 0) {
          rows.push({
            bill_id: item.bill_id,
            bill_title: billMap.get(item.bill_id) || 'Untitled Bill',
            item_id: item.id,
            item_name: item.name,
            quantity: Number(item.quantity || 0),
            rate: Number(item.rate || 0),
            amount: Number(item.amount || 0),
            member_id: null,
            member_name: 'Unassigned',
            consumed_quantity: 0,
            share_amount: 0,
            bill_discount_amount: billDiscountMap.get(item.bill_id) || 0,
            bill_discount_excluded_members: billDiscountExcludedMap.get(item.bill_id) || [],
            created_at: item.created_at,
          });
          return;
        }

         itemAssignments.forEach((assignment) => {
          rows.push({
            bill_id: item.bill_id,
            bill_title: billMap.get(item.bill_id) || 'Untitled Bill',
            item_id: item.id,
            item_name: item.name,
            quantity: Number(item.quantity || 0),
            rate: Number(item.rate || 0),
            amount: Number(item.amount || 0),
            member_id: assignment.member_id,
            member_name: memberMap.get(assignment.member_id) || 'Unknown Member',
            consumed_quantity: Number(assignment.consumed_quantity || 0),
            share_amount: Number(assignment.share_amount || 0),
            bill_discount_amount: billDiscountMap.get(item.bill_id) || 0,
            bill_discount_excluded_members: billDiscountExcludedMap.get(item.bill_id) || [],
            created_at: item.created_at,
          });
        });
      });

      return rows;
    },
    enabled: !!networkId,
  });
};
