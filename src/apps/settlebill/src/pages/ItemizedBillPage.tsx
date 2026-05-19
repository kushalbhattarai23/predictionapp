import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, Users, Upload, Camera, X, Loader2, Edit2, Check, ScanLine } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useNetworks, useNetworkMembers } from '@/hooks/useSettleGaraNetworks';
import { useCreateBill } from '@/hooks/useSettleGaraBills';
import { useCreateBillItems } from '@/hooks/useSettleGaraBillItems';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { supabase } from '@/integrations/supabase/client';

interface BillItem {
  id: string;
  name: string;
  quantity: number;
  rate: number;
  amount: number;
  assignedMembers: string[];
  memberQuantities: Record<string, number>;
  status: 'unpaid' | 'paid';
  isEditing?: boolean;
}

interface NetworkMember {
  id: string;
  user_name: string;
  user_email: string;
}

const generateItemId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `item-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const parseNumericValue = (value: unknown, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = value.replace(/,/g, '').trim();
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const roundTo = (value: number, decimals = 6) => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

const distributeEvenly = (total: number, count: number, decimals = 6) => {
  if (count <= 0) return [];
  const perMember = total / count;
  const values = Array.from({ length: count }, () => roundTo(perMember, decimals));
  const allocated = values.reduce((sum, value) => sum + value, 0);
  const remainder = roundTo(total - allocated, decimals);
  values[count - 1] = roundTo(values[count - 1] + remainder, decimals);
  return values;
};

// Color palette for member badges
const memberColors = [
  'bg-red-200 text-red-800',
  'bg-green-200 text-green-800',
  'bg-blue-200 text-blue-800',
  'bg-yellow-200 text-yellow-800',
  'bg-purple-200 text-purple-800',
  'bg-pink-200 text-pink-800',
  'bg-cyan-200 text-cyan-800',
  'bg-orange-200 text-orange-800',
];

export const ItemizedBillPage: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: networks = [], isLoading: networksLoading } = useNetworks();
  const createBillMutation = useCreateBill();
  const createBillItemsMutation = useCreateBillItems();

  const [selectedNetworkId, setSelectedNetworkId] = useState<string>('');
  const { data: networkMembers = [] } = useNetworkMembers(selectedNetworkId);
  
  const [billTitle, setBillTitle] = useState('');
  const [paidBy, setPaidBy] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountExcludedMembers, setDiscountExcludedMembers] = useState<string[]>([]);
  const [items, setItems] = useState<BillItem[]>([]);
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, rate: 0 });
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [editingItem, setEditingItem] = useState<BillItem | null>(null);
  const [splitItemId, setSplitItemId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should be less than 10MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setIsUploading(false);
        toast.success('Bill image uploaded successfully!');
      };
      reader.onerror = () => {
        toast.error('Failed to read image');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // OCR Extraction function
  const extractBillFromImage = async () => {
    if (!uploadedImage) {
      toast.error('Please upload a bill image first');
      return;
    }

    setIsExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-bill-ocr', {
        body: { imageBase64: uploadedImage }
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'error' in data && data.error) {
        throw new Error(String(data.error));
      }

      const rawItems = data && typeof data === 'object' && Array.isArray((data as any).items)
        ? (data as any).items
        : [];

      const extractedItems: BillItem[] = rawItems
        .filter((item: unknown) => item && typeof item === 'object')
        .map((item: any) => {
          const quantity = parseNumericValue(item.quantity, 1);
          const rate = parseNumericValue(item.rate, 0);
          const amount = parseNumericValue(item.amount, quantity * rate);

          return {
            id: generateItemId(),
            name: typeof item.name === 'string' && item.name.trim() ? item.name.trim() : 'Unknown Item',
            quantity: quantity > 0 ? quantity : 1,
            rate: rate >= 0 ? rate : 0,
            amount: amount >= 0 ? amount : 0,
            assignedMembers: [],
            memberQuantities: {},
            status: 'unpaid' as const,
          };
        });

      if (extractedItems.length === 0) {
        toast.error('Could not extract valid items from the bill');
        return;
      }

      setItems((prevItems) => [...prevItems, ...extractedItems]);

      const extractedBillTitle = data && typeof data === 'object' ? (data as any).billTitle : null;
      if (typeof extractedBillTitle === 'string' && extractedBillTitle.trim() && !billTitle) {
        setBillTitle(extractedBillTitle.trim());
      }

      const extractedDiscount = data && typeof data === 'object' ? (data as any).discount : null;
      if (extractedDiscount && Number(extractedDiscount) > 0) {
        setDiscountAmount(Number(extractedDiscount));
        toast.success(`Extracted ${extractedItems.length} items and discount of ${extractedDiscount}!`);
      } else {
        toast.success(`Successfully extracted ${extractedItems.length} items from the bill!`);
      }
    } catch (error: any) {
      console.error('OCR extraction error:', error);
      toast.error(error.message || 'Failed to extract bill data');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleNetworkChange = (networkId: string) => {
    setSelectedNetworkId(networkId);
    setPaidBy('');
  };

  const addItem = () => {
    if (!newItem.name || newItem.rate <= 0) {
      toast.error('Please enter item name and rate');
      return;
    }
    
    const item: BillItem = {
      id: generateItemId(),
      name: newItem.name,
      quantity: newItem.quantity,
      rate: newItem.rate,
      amount: newItem.quantity * newItem.rate,
      assignedMembers: [],
      memberQuantities: {},
      status: 'unpaid'
    };
    
    setItems([...items, item]);
    setNewItem({ name: '', quantity: 1, rate: 0 });
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Edit item functions
  const startEditItem = (item: BillItem) => {
    setEditingItem({ ...item });
  };

  const saveEditItem = () => {
    if (!editingItem) return;
    
    setItems(items.map(item => 
      item.id === editingItem.id 
        ? { 
            ...editingItem, 
            amount: editingItem.quantity * editingItem.rate,
            isEditing: false 
          }
        : item
    ));
    setEditingItem(null);
    toast.success('Item updated');
  };

  const cancelEditItem = () => {
    setEditingItem(null);
  };


  const toggleMemberAssignment = (itemId: string, memberId: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const isAssigned = item.assignedMembers.includes(memberId);
        
        if (isAssigned) {
          // Remove member and redistribute evenly among remaining members
          const newAssigned = item.assignedMembers.filter(id => id !== memberId);
          const newQuantities: Record<string, number> = {};
          if (newAssigned.length > 0) {
            const distributedQuantities = distributeEvenly(item.quantity, newAssigned.length);
            newAssigned.forEach((id, idx) => {
              newQuantities[id] = distributedQuantities[idx] || 0;
            });
          }
          return { ...item, assignedMembers: newAssigned, memberQuantities: newQuantities };
        } else {
          // Add member and redistribute evenly among all members
          const newAssigned = [...item.assignedMembers, memberId];
          const newQuantities: Record<string, number> = {};
          const distributedQuantities = distributeEvenly(item.quantity, newAssigned.length);
          newAssigned.forEach((id, idx) => {
            newQuantities[id] = distributedQuantities[idx] || 0;
          });
          return { ...item, assignedMembers: newAssigned, memberQuantities: newQuantities };
        }
      }
      return item;
    }));
  };

  const updateMemberConsumedQuantity = (itemId: string, memberId: string, nextQuantity: number) => {
    setItems(items.map(item => {
      if (item.id !== itemId) return item;

      const safeQuantity = Number.isFinite(nextQuantity) ? Math.max(0, nextQuantity) : 0;
      const shouldAssign = safeQuantity > 0;

      // Only update this member's quantity. Do NOT auto-redistribute to others.
      const nextMemberQuantities: Record<string, number> = { ...item.memberQuantities };
      if (shouldAssign) {
        nextMemberQuantities[memberId] = roundTo(safeQuantity);
      } else {
        delete nextMemberQuantities[memberId];
      }

      return {
        ...item,
        assignedMembers: shouldAssign
          ? Array.from(new Set([...item.assignedMembers, memberId]))
          : item.assignedMembers.filter(id => id !== memberId),
        memberQuantities: nextMemberQuantities,
      };
    }));
  };

  const toggleAllMembersForItem = (itemId: string) => {
    setItems(items.map(item => {
      if (item.id !== itemId) return item;
      const allSelected = networkMembers.length > 0 && item.assignedMembers.length === networkMembers.length;
      if (allSelected) {
        return { ...item, assignedMembers: [], memberQuantities: {} };
      }
      const newAssigned = networkMembers.map(m => m.id);
      const distributedQuantities = distributeEvenly(item.quantity, newAssigned.length);
      const newQuantities: Record<string, number> = {};
      newAssigned.forEach((id, idx) => {
        newQuantities[id] = distributedQuantities[idx] || 0;
      });
      return { ...item, assignedMembers: newAssigned, memberQuantities: newQuantities };
    }));
  };

  const getAssignedQuantity = (item: BillItem) =>
    roundTo(Object.values(item.memberQuantities).reduce((sum, qty) => sum + qty, 0));

  const evenSplitItem = (itemId: string) => {
    setItems(items.map((item) => {
      if (item.id !== itemId) return item;
      if (item.assignedMembers.length === 0) return item;

      const distributedQuantities = distributeEvenly(item.quantity, item.assignedMembers.length);
      const memberQuantities = item.assignedMembers.reduce<Record<string, number>>((acc, memberId, index) => {
        acc[memberId] = distributedQuantities[index] || 0;
        return acc;
      }, {});

      return {
        ...item,
        memberQuantities,
      };
    }));
  };

  const getDistributionError = (item: BillItem) => {
    const assignedQuantity = getAssignedQuantity(item);
    if (Math.abs(assignedQuantity - item.quantity) <= 0.0001) {
      return null;
    }
    if (assignedQuantity > item.quantity) {
      return 'Assigned quantity exceeds item quantity.';
    }
    if (assignedQuantity !== item.quantity) {
      return `Distribute exactly ${roundTo(item.quantity)}. Currently assigned ${roundTo(assignedQuantity)}.`;
    }
    return null;
  };

  const toggleItemStatus = (itemId: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          status: item.status === 'paid' ? 'unpaid' : 'paid'
        };
      }
      return item;
    }));
  };

  const getMemberColor = (memberId: string) => {
    const index = networkMembers.findIndex(m => m.id === memberId);
    return memberColors[index % memberColors.length];
  };

  const getMemberName = (memberId: string) => {
    return networkMembers.find(m => m.id === memberId)?.user_name || 'Unknown';
  };

  const getSubTotal = () => items.reduce((sum, item) => sum + item.amount, 0);
  const getDiscount = () => discountAmount;
  const getGrandTotal = () => Math.max(0, getSubTotal() - discountAmount);

  const isDistributionBalanced = (item: BillItem) => {
    const assigned = getAssignedQuantity(item);
    return Math.abs(assigned - item.quantity) <= 0.0001;
  };

  const getMemberPayableAmount = (item: BillItem, memberId: string) => {
    const consumed = item.memberQuantities[memberId] || 0;
    const perUnitRate = item.quantity > 0 ? item.amount / item.quantity : 0;
    return consumed * perUnitRate;
  };

  const hasInvalidDistribution = items.some((item) => !isDistributionBalanced(item));

  const handleCreateBill = async () => {
    if (!selectedNetworkId || !billTitle || !paidBy || items.length === 0) {
      toast.error('Please fill all required fields and add at least one item');
      return;
    }

    const invalidDistributionItems = items.filter((item) => item.assignedMembers.length === 0 || getDistributionError(item));
    if (invalidDistributionItems.length > 0) {
      toast.error('Please assign quantities correctly for every item');
      return;
    }

    try {
      const memberSplits: { [memberId: string]: number } = {};
      const subTotal = getSubTotal();
      const grandTotal = getGrandTotal();
      
      // Calculate splits based on items and apply discount proportionally
      items.forEach(item => {
        const perUnitRate = item.quantity > 0 ? item.amount / item.quantity : 0;
        Object.entries(item.memberQuantities)
          .filter(([, consumedQty]) => consumedQty > 0)
          .forEach(([memberId, consumedQty]) => {
            memberSplits[memberId] = (memberSplits[memberId] || 0) + (perUnitRate * consumedQty);
          });
      });

      // Apply discount equally among eligible members (not excluded)
      const membersWithSplits = Object.keys(memberSplits);
      const eligibleMembers = membersWithSplits.filter(id => !discountExcludedMembers.includes(id));
      if (discountAmount > 0 && eligibleMembers.length > 0) {
        const discountPerMember = discountAmount / eligibleMembers.length;
        eligibleMembers.forEach(memberId => {
          memberSplits[memberId] = Math.max(0, memberSplits[memberId] - discountPerMember);
        });
      }

      const splits = Object.entries(memberSplits).map(([memberId, amount]) => ({
        member_id: memberId,
        amount: Math.round(amount * 100) / 100
      }));

      // Upload the bill image (if any) to storage so it persists
      let billImageUrl: string | null = null;
      if (uploadedImage && user) {
        try {
          const blob = await (await fetch(uploadedImage)).blob();
          const ext = (blob.type.split('/')[1] || 'jpg').split('+')[0];
          const filePath = `bills/${selectedNetworkId}/${user.id}/${Date.now()}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from('settlebill-images')
            .upload(filePath, blob, { contentType: blob.type, upsert: false });
          if (!uploadError) {
            const { data: pub } = supabase.storage.from('settlebill-images').getPublicUrl(filePath);
            billImageUrl = pub.publicUrl;
          } else {
            console.error('Bill image upload failed:', uploadError);
          }
        } catch (err) {
          console.error('Bill image processing failed:', err);
        }
      }

      // Create the bill with is_itemized flag set to true
      const createdBill = await createBillMutation.mutateAsync({
        bill: {
          network_id: selectedNetworkId,
          title: billTitle,
          description: `Itemized bill with ${items.length} items`,
          total_amount: subTotal,
          discount_amount: discountAmount,
          discount_excluded_members: discountExcludedMembers,
          paid_by: paidBy,
          currency: 'NPR',
          status: 'active',
          is_itemized: true,
          bill_image_url: billImageUrl,
        },
        splits
      });

      // Save the individual items and their member assignments
      if (createdBill?.id) {
        await createBillItemsMutation.mutateAsync({
          billId: createdBill.id,
          items: items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount,
            memberQuantities: item.memberQuantities
          }))
        });
      }

      toast.success('Itemized bill created successfully!');
      navigate('/settlebill/bills');
    } catch (error) {
      console.error('Error creating bill:', error);
      toast.error('Failed to create bill');
    }
  };

  

  const content = (
    <>
      <div className="grid gap-6">
          {/* Step 1: Select Network */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-t-lg">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Step 1: Select Network & Bill Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Network <span className="text-red-500">*</span></Label>
                  <Select value={selectedNetworkId} onValueChange={handleNetworkChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select network first" />
                    </SelectTrigger>
                    <SelectContent>
                      {networks.map((network) => (
                        <SelectItem key={network.id} value={network.id}>
                          {network.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Bill Title</Label>
                  <Input
                    placeholder="e.g., Dinner at Restaurant"
                    value={billTitle}
                    onChange={(e) => setBillTitle(e.target.value)}
                    disabled={!selectedNetworkId}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Paid By</Label>
                  <Select value={paidBy} onValueChange={setPaidBy} disabled={!selectedNetworkId}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedNetworkId ? "Who paid?" : "Select network first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {networkMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.user_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Discount (Fixed)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={discountAmount || ''}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    disabled={!selectedNetworkId}
                  />
                </div>
              </div>

              {/* Discount Exclusion - show when discount > 0 and members exist */}
              {discountAmount > 0 && networkMembers.length > 0 && (
                <div className="pt-4 border-t">
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    Exclude from Discount ({discountExcludedMembers.length} excluded)
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Selected members will NOT receive any discount share
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {networkMembers.map((member, index) => {
                      const isExcluded = discountExcludedMembers.includes(member.id);
                      return (
                        <label
                          key={member.id}
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors ${
                            isExcluded
                              ? 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          <Checkbox
                            checked={isExcluded}
                            onCheckedChange={() => {
                              setDiscountExcludedMembers(prev =>
                                prev.includes(member.id)
                                  ? prev.filter(id => id !== member.id)
                                  : [...prev, member.id]
                              );
                            }}
                            className="h-3.5 w-3.5"
                          />
                          <span className="text-xs font-medium">{member.user_name}</span>
                          {isExcluded && <span className="text-xs opacity-75">(No discount)</span>}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Show network members after selection */}
              {selectedNetworkId && networkMembers.length > 0 && (
                <div className="pt-4 border-t">
                  <Label className="text-sm text-muted-foreground mb-2 block">Network Members ({networkMembers.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {networkMembers.map((member, index) => (
                      <Badge key={member.id} className={memberColors[index % memberColors.length]}>
                        {member.user_name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Upload Bill Image - Only show after network selected */}
          <Card className={`shadow-lg ${!selectedNetworkId ? 'opacity-60' : ''}`}>
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-t-lg">
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Step 2: Upload Bill Image (OCR)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {!selectedNetworkId ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Please select a network first to upload a bill</p>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  {!uploadedImage ? (
                    <div
                      onClick={triggerFileInput}
                      className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 flex items-center justify-center">
                          <Upload className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Click to upload bill image</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Take a photo or upload a receipt image
                          </p>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary" className="gap-1">JPG, PNG, HEIC</Badge>
                          <Badge variant="secondary">Max 10MB</Badge>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative rounded-lg overflow-hidden border">
                        <img
                          src={uploadedImage}
                          alt="Uploaded bill"
                          className="w-full max-h-[300px] object-contain bg-muted/20"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={removeImage}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <Button
                        onClick={extractBillFromImage}
                        disabled={isExtracting}
                        className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                      >
                        {isExtracting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Extracting Bill Data...
                          </>
                        ) : (
                          <>
                            <ScanLine className="w-4 h-4 mr-2" />
                            Extract Items from Bill (OCR)
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {isUploading && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                      <span className="ml-2 text-muted-foreground">Uploading...</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Add Items Manually */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Add Items Manually</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[150px] space-y-2">
                  <Label>Item Name</Label>
                  <Input
                    placeholder="e.g., Coke, Fanta"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  />
                </div>
                <div className="w-24 space-y-2">
                  <Label>Qty</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 1 })}
                  />
                </div>
                <div className="w-28 space-y-2">
                  <Label>Rate</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newItem.rate || ''}
                    onChange={(e) => setNewItem({ ...newItem, rate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <Button onClick={addItem} className="bg-cyan-600 hover:bg-cyan-700">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Items Table - Styled like reference image */}
          {items.length > 0 && (
            <Card className="shadow-lg overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-emerald-700 hover:bg-emerald-700">
                        <TableHead className="text-white font-semibold w-16"># S.N.</TableHead>
                        <TableHead className="text-white font-semibold">Particulars (Item)</TableHead>
                        <TableHead className="text-white font-semibold text-center w-20"># Qty</TableHead>
                        <TableHead className="text-white font-semibold text-right w-24"># Rate</TableHead>
                        <TableHead className="text-white font-semibold text-right w-28"># Amount</TableHead>
                        <TableHead className="text-white font-semibold">
                          <Users className="w-4 h-4 inline mr-1" />
                          Person Name
                        </TableHead>
                        <TableHead className="text-white font-semibold text-center w-24">
                          <span className="inline-flex items-center gap-1">⊙ state</span>
                        </TableHead>
                        <TableHead className="text-white font-semibold text-center w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={item.id} className="hover:bg-muted/30 border-b">
                          <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                          <TableCell>
                            {editingItem?.id === item.id ? (
                              <Input
                                value={editingItem.name}
                                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                className="h-8"
                              />
                            ) : (
                              <span className={item.status === 'paid' ? 'bg-yellow-200 px-2 py-1 rounded' : ''}>
                                {item.name}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {editingItem?.id === item.id ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editingItem.quantity}
                                onChange={(e) => setEditingItem({ ...editingItem, quantity: parseFloat(e.target.value) || 1 })}
                                className="h-8 w-20"
                              />
                            ) : (
                              item.quantity
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editingItem?.id === item.id ? (
                              <Input
                                type="number"
                                value={editingItem.rate}
                                onChange={(e) => setEditingItem({ ...editingItem, rate: parseFloat(e.target.value) || 0 })}
                                className="h-8 w-20"
                              />
                            ) : (
                              item.rate.toLocaleString()
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {editingItem?.id === item.id 
                              ? (editingItem.quantity * editingItem.rate).toLocaleString()
                              : item.amount.toLocaleString()
                            }
                          </TableCell>
                          <TableCell>
                            {!selectedNetworkId ? (
                              <span className="text-muted-foreground text-sm">Select a network first</span>
                            ) : networkMembers.length === 0 ? (
                              <span className="text-muted-foreground text-sm">No members in network</span>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                  {networkMembers.map((member) => {
                                    const isAssigned = item.assignedMembers.includes(member.id);
                                    return (
                                      <label
                                        key={member.id}
                                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors ${
                                          isAssigned 
                                            ? getMemberColor(member.id) 
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                        }`}
                                      >
                                        <Checkbox
                                          checked={isAssigned}
                                          onCheckedChange={() => toggleMemberAssignment(item.id, member.id)}
                                          className="h-3.5 w-3.5"
                                        />
                                        <span className="text-xs font-medium">{member.user_name}</span>
                                        {isAssigned && (
                                          <span className="text-xs opacity-75">
                                            ({(item.memberQuantities[member.id] ?? 0).toFixed(2)})
                                          </span>
                                        )}
                                      </label>
                                    );
                                  })}
                                </div>
                                {item.assignedMembers.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() => evenSplitItem(item.id)}
                                    >
                                      Evenly Divide
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() => setSplitItemId(item.id)}
                                    >
                                      <Users className="w-3 h-3 mr-1" />
                                      Split / Distribution
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                            {getDistributionError(item) && (
                              <p className="mt-2 text-xs text-destructive">{getDistributionError(item)}</p>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="secondary"
                              className={`cursor-pointer px-3 py-1 ${
                                item.status === 'paid' 
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                              onClick={() => toggleItemStatus(item.id)}
                            >
                              {item.status === 'paid' ? 'Paid' : 'Unpaid'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {editingItem?.id === item.id ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={saveEditItem}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50 p-1 h-8 w-8"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={cancelEditItem}
                                    className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 p-1 h-8 w-8"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startEditItem(item)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 h-8 w-8"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeItem(item.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Sub Total Row */}
                      <TableRow className="bg-gray-50 dark:bg-gray-800/50 border-t-2">
                        <TableCell colSpan={4} className="text-right font-semibold text-muted-foreground">
                          SUB TOTAL
                        </TableCell>
                        <TableCell className="text-right font-bold">{getSubTotal().toLocaleString()}</TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-red-100 text-red-700">Unpaid</Badge>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                      {/* Discount Row - Only show if discount exists */}
                      {discountAmount > 0 && (
                        <TableRow className="bg-green-50 dark:bg-green-900/20">
                          <TableCell colSpan={4} className="text-right font-semibold text-green-700 dark:text-green-400">
                            DISCOUNT
                          </TableCell>
                          <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
                            -{getDiscount().toLocaleString()}
                          </TableCell>
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      )}
                      {/* Grand Total Row */}
                      <TableRow className="bg-gray-100 dark:bg-gray-700/50">
                        <TableCell colSpan={4} className="text-right font-bold text-foreground">
                          GRAND TOTAL
                        </TableCell>
                        <TableCell className="text-right font-bold text-lg">{getGrandTotal().toLocaleString()}</TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-red-100 text-red-700">Unpaid</Badge>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          <Dialog open={!!splitItemId} onOpenChange={(open) => !open && setSplitItemId(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Item Distribution</DialogTitle>
              </DialogHeader>
              {splitItemId && (() => {
                const currentItem = items.find((item) => item.id === splitItemId);
                if (!currentItem) return <p className="text-sm text-muted-foreground">Item not found.</p>;
                const assignedQuantity = getAssignedQuantity(currentItem);
                const distributionError = getDistributionError(currentItem);
                const perUnitRate = currentItem.quantity > 0 ? currentItem.amount / currentItem.quantity : 0;

                return (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">{currentItem.name}</p>
                      <p>Total Qty: {currentItem.quantity} • Per Unit Rate: {perUnitRate.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-end gap-2 flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAllMembersForItem(currentItem.id)}
                      >
                        {networkMembers.length > 0 && currentItem.assignedMembers.length === networkMembers.length
                          ? 'Deselect All'
                          : 'Select All'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => evenSplitItem(currentItem.id)}
                      >
                        Evenly Divide This Item
                      </Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Person</TableHead>
                          <TableHead className="text-right">Consumed Quantity</TableHead>
                          <TableHead className="text-right">Amount Preview</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {networkMembers.map((member) => {
                          const isAssigned = currentItem.assignedMembers.includes(member.id);
                          const currentQty = currentItem.memberQuantities[member.id] ?? 0;
                          const presets = [0, 0.25, 0.5, 1];
                          // Add item quantity as a preset if not already included
                          if (currentItem.quantity > 1 && !presets.includes(currentItem.quantity)) {
                            presets.push(currentItem.quantity);
                          }
                          return (
                            <TableRow key={member.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={isAssigned}
                                    onCheckedChange={() => toggleMemberAssignment(currentItem.id, member.id)}
                                  />
                                  <span>{member.user_name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center gap-1 justify-end flex-wrap">
                                  {presets.map((val) => (
                                    <Button
                                      key={val}
                                      type="button"
                                      variant={currentQty === val ? 'default' : 'outline'}
                                      size="sm"
                                      className="h-7 px-2 text-xs min-w-[36px]"
                                      onClick={() => updateMemberConsumedQuantity(currentItem.id, member.id, val)}
                                    >
                                      {val}
                                    </Button>
                                  ))}
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    value={currentQty || ''}
                                    placeholder="0"
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === '' || val === '.') {
                                        updateMemberConsumedQuantity(currentItem.id, member.id, 0);
                                        return;
                                      }
                                      const parsed = parseFloat(val);
                                      if (!isNaN(parsed)) {
                                        updateMemberConsumedQuantity(currentItem.id, member.id, parsed);
                                      }
                                    }}
                                    className="h-7 w-16 text-center text-sm"
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {getMemberPayableAmount(currentItem, member.id).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    <div className="flex items-center justify-between text-sm">
                      <p>Total allocated quantity: <span className="font-semibold">{assignedQuantity.toFixed(2)}</span></p>
                      {distributionError ? (
                        <p className="text-red-600 font-medium">{distributionError}</p>
                      ) : (
                        <p className="text-green-600 font-medium">Balanced distribution</p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </DialogContent>
          </Dialog>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate('/settlebill/bills')}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateBill}
              disabled={!selectedNetworkId || !billTitle || !paidBy || items.length === 0 || hasInvalidDistribution || createBillMutation.isPending}
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
            >
              {createBillMutation.isPending ? 'Creating...' : 'Create Bill'}
            </Button>
          </div>
        </div>
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-4 md:mb-6">
          <Link to="/settlebill/bills">
            <Button variant="ghost" size="sm" className="flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Back to Bills</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Bill Split with OCR</h1>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Upload a bill image and extract items automatically
            </p>
          </div>
        </div>
        {content}
      </div>
    </div>
  );
};
