import { NetworkBillItemRow } from '@/hooks/useSettleGaraBillItems';
import { BillSplitWithDetails } from '@/hooks/useSettleGaraBillSplits';

export interface FinalAmountMemberRow {
  member: string;
  itemsOrdered: string;
  itemsSubtotal: number;
  discountShare: number;
  finalAmount: number;
}

export interface PayableReceivableRow {
  member: string;
  payable: number;
  receivable: number;
  net: number;
}

export interface SettlementRow {
  from: string;
  to: string;
  amount: number;
}

export interface FinalAmountCalculationResult {
  finalAmountRows: FinalAmountMemberRow[];
  breakdownRows: PayableReceivableRow[];
  settlementRows: SettlementRow[];
  totals: {
    totalPayable: number;
    totalReceivable: number;
  };
  calculationDate: string;
}

export const generateFinalAmountCalculation = (
  networkBillItems: NetworkBillItemRow[] = [],
  billSplits: (BillSplitWithDetails & { payer_id?: string })[] = []
): FinalAmountCalculationResult => {
  const rowsWithMembers = networkBillItems.filter((row) => row.member_id);

  // Calculate per-member discount share per bill.
  // Discount is split equally among members who actually have items in that bill AND are not excluded.
  const billMembersMap = new Map<string, Set<string>>();
  const billExcludedMembersMap = new Map<string, string[]>();
  
  rowsWithMembers.forEach((row) => {
    const membersInBill = billMembersMap.get(row.bill_id) || new Set<string>();
    membersInBill.add(row.member_name);
    billMembersMap.set(row.bill_id, membersInBill);
    
    // Store excluded members per bill (use member_id based exclusion mapped to names)
    if (!billExcludedMembersMap.has(row.bill_id)) {
      billExcludedMembersMap.set(row.bill_id, (row as any).bill_discount_excluded_members || []);
    }
  });

  // Build a member_id to member_name map from the rows
  const memberIdToName = new Map<string, string>();
  rowsWithMembers.forEach((row) => {
    if (row.member_id) {
      memberIdToName.set(row.member_id, row.member_name);
    }
  });

  const memberDiscountMap = new Map<string, number>();
  const processedBillDiscounts = new Set<string>();

  rowsWithMembers.forEach((row) => {
    if (processedBillDiscounts.has(row.bill_id)) {
      return;
    }

    const billDiscount = Number(row.bill_discount_amount || 0);
    const membersInBill = billMembersMap.get(row.bill_id);
    const excludedMemberIds = billExcludedMembersMap.get(row.bill_id) || [];
    
    // Get excluded member names
    const excludedMemberNames = new Set(
      excludedMemberIds.map(id => memberIdToName.get(id)).filter(Boolean) as string[]
    );

    // Count eligible members (those not excluded)
    const eligibleMembers = membersInBill 
      ? Array.from(membersInBill).filter(name => !excludedMemberNames.has(name))
      : [];
    const eligibleMemberCount = eligibleMembers.length;

    if (billDiscount > 0 && eligibleMemberCount > 0) {
      const perMemberDiscount = billDiscount / eligibleMemberCount;
      eligibleMembers.forEach((memberName) => {
        memberDiscountMap.set(memberName, (memberDiscountMap.get(memberName) || 0) + perMemberDiscount);
      });
    }

    processedBillDiscounts.add(row.bill_id);
  });

  const groupedByMember = rowsWithMembers.reduce((acc, row) => {
    const current = acc.get(row.member_name) || [];
    current.push(row);
    acc.set(row.member_name, current);
    return acc;
  }, new Map<string, NetworkBillItemRow[]>());

  const finalAmountRows: FinalAmountMemberRow[] = Array.from(groupedByMember.entries())
    .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
    .map(([memberName, memberRows]) => {
      const subtotal = memberRows.reduce((sum, row) => sum + Number(row.share_amount || 0), 0);
      const discountShare = memberDiscountMap.get(memberName) || 0;
      const itemBreakdown = memberRows
        .map((row) => {
          return `${row.item_name} (${row.consumed_quantity}/${row.quantity} qty × ${Number(row.rate || 0).toFixed(2)}) => ${Number(row.share_amount || 0).toFixed(2)}`;
        })
        .join(' | ');

      return {
        member: memberName,
        itemsOrdered: itemBreakdown,
        itemsSubtotal: Number(subtotal.toFixed(2)),
        discountShare: Number(discountShare.toFixed(2)),
        finalAmount: Number((subtotal - discountShare).toFixed(2)),
      };
    });

  // For non-itemized bills: find members in splits that are NOT already in finalAmountRows
  const membersWithItems = new Set(finalAmountRows.map(r => r.member));
  // Group bill_ids that have items
  const billIdsWithItems = new Set(rowsWithMembers.map(r => r.bill_id));

  // Find splits from bills that have NO items
  const nonItemizedSplits = billSplits.filter(s => !billIdsWithItems.has(s.bill_id));
  const nonItemizedByMember = new Map<string, { total: number; billRows: { bill: string; amount: number }[] }>();

  nonItemizedSplits.forEach(split => {
    const memberName = split.member_name || 'Unknown';
    const amount = Number(split.amount || 0);
    const billTitle = split.bill_title || 'Untitled Bill';
    const existing = nonItemizedByMember.get(memberName) || { total: 0, billRows: [] };
    existing.total += amount;
    existing.billRows.push({ bill: billTitle, amount });
    nonItemizedByMember.set(memberName, existing);
  });

  nonItemizedByMember.forEach((data, memberName) => {
    if (membersWithItems.has(memberName)) {
      // Add to existing row
      const existingRow = finalAmountRows.find(r => r.member === memberName);
      if (existingRow) {
        const billBreakdown = data.billRows
          .map(({ bill, amount }) => `${bill} (split share: 1 qty × ${amount.toFixed(2)} = ${amount.toFixed(2)})`)
          .join(' | ');
        existingRow.itemsOrdered = existingRow.itemsOrdered
          ? `${existingRow.itemsOrdered} | ${billBreakdown}`
          : billBreakdown;
        existingRow.itemsSubtotal = Number((existingRow.itemsSubtotal + data.total).toFixed(2));
        existingRow.finalAmount = Number((existingRow.itemsSubtotal - existingRow.discountShare).toFixed(2));
      }
    } else {
      finalAmountRows.push({
        member: memberName,
        itemsOrdered: data.billRows
          .map(({ bill, amount }) => `${bill} (split share: 1 qty × ${amount.toFixed(2)} = ${amount.toFixed(2)})`)
          .join(' | '),
        itemsSubtotal: Number(data.total.toFixed(2)),
        discountShare: 0,
        finalAmount: Number(data.total.toFixed(2)),
      });
    }
  });

  const payableMap = new Map<string, number>();
  const receivableMap = new Map<string, number>();
  const memberNames = new Set<string>();

  billSplits.forEach((split) => {
    const payerId = split.payer_id;
    const memberId = split.member_id;
    const amount = Number(split.amount || 0);

    if (!payerId || amount <= 0) {
      return;
    }

    const payerName = split.payer_name || 'Unknown';
    const memberName = split.member_name || 'Unknown';

    memberNames.add(payerName);
    memberNames.add(memberName);

    if (payerId !== memberId) {
      payableMap.set(memberName, (payableMap.get(memberName) || 0) + amount);
      receivableMap.set(payerName, (receivableMap.get(payerName) || 0) + amount);
    }
  });

  finalAmountRows.forEach((row) => memberNames.add(row.member));

  const breakdownRows = Array.from(memberNames)
    .sort((a, b) => a.localeCompare(b))
    .map((member) => {
      const payable = Number((payableMap.get(member) || 0).toFixed(2));
      const receivable = Number((receivableMap.get(member) || 0).toFixed(2));

      return {
        member,
        payable,
        receivable,
        net: Number((receivable - payable).toFixed(2)),
      };
    });

  const debtors = breakdownRows
    .filter((row) => row.net < 0)
    .map((row) => ({ member: row.member, amount: Math.abs(row.net) }));
  const creditors = breakdownRows
    .filter((row) => row.net > 0)
    .map((row) => ({ member: row.member, amount: row.net }));

  const settlementRows: SettlementRow[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];

    const settlementAmount = Math.min(debtor.amount, creditor.amount);

    if (settlementAmount > 0.009) {
      settlementRows.push({
        from: debtor.member,
        to: creditor.member,
        amount: Number(settlementAmount.toFixed(2)),
      });
    }

    debtor.amount = Number((debtor.amount - settlementAmount).toFixed(2));
    creditor.amount = Number((creditor.amount - settlementAmount).toFixed(2));

    if (debtor.amount <= 0.009) debtorIndex += 1;
    if (creditor.amount <= 0.009) creditorIndex += 1;
  }

  const totalPayable = breakdownRows.reduce((sum, row) => sum + row.payable, 0);
  const totalReceivable = breakdownRows.reduce((sum, row) => sum + row.receivable, 0);

  return {
    finalAmountRows,
    breakdownRows,
    settlementRows,
    totals: {
      totalPayable: Number(totalPayable.toFixed(2)),
      totalReceivable: Number(totalReceivable.toFixed(2)),
    },
    calculationDate: new Date().toISOString(),
  };
};
