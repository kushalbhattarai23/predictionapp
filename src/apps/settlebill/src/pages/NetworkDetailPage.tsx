
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNetworkMembers, useNetworks, useRemoveNetworkMember } from '@/hooks/useSettleBillNetworks';
import { AddMemberForm } from '../components/AddMemberForm';
import { ArrowLeft, Users, UserPlus, Settings, Trash2, Receipt, FileSpreadsheet, Link2, Copy, ExternalLink, ImagePlus, X, Check, Image, Wallet, Upload, RefreshCw } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BillSplitWithDetails, useNetworkBillSplits } from '@/hooks/useSettleGaraBillSplits';
import { useNetworkBillItems } from '@/hooks/useSettleGaraBillItems';
import { useQueryClient } from '@tanstack/react-query';
import { downloadStyledExcel } from '@/utils/excelUtils';
import { useCurrency } from '@/hooks/useCurrency';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { convertToCSV, downloadCSV } from '@/utils/csvUtils';
import { generateFinalAmountCalculation } from '../utils/finalAmountCalculation';
import { useCreateFinalCalculationShare, useNetworkFinalCalculationShares, useDeleteFinalCalculationShare, useUpdateFinalCalculationShare } from '@/hooks/useFinalCalculationShares';
import { useMemberWalletImages } from '@/hooks/useMemberWalletImages';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export const NetworkDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: networks } = useNetworks();
  const { data: members, isLoading } = useNetworkMembers(id || '');
  const { data: billSplits } = useNetworkBillSplits(id || '');
  const { data: networkBillItems, isLoading: isLoadingItems } = useNetworkBillItems(id || '');
  const [showAddMember, setShowAddMember] = useState(false);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [existingImages, setExistingImages] = useState<{ name: string; url: string }[]>([]);
  const [selectedExistingImages, setSelectedExistingImages] = useState<string[]>([]);
  const [showExistingImages, setShowExistingImages] = useState(false);
  const [galleryImages, setGalleryImages] = useState<{ name: string; url: string }[]>([]);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>([]);
  const [showGalleryImages, setShowGalleryImages] = useState(false);
  const [showWalletImages, setShowWalletImages] = useState(false);
  const [selectedWalletImages, setSelectedWalletImages] = useState<string[]>([]);
  const [walletUploadMemberId, setWalletUploadMemberId] = useState<string | null>(null);
  const [additionalWalletMemberIds, setAdditionalWalletMemberIds] = useState<string[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const walletImageInputRef = useRef<HTMLInputElement>(null);
  const removeNetworkMemberMutation = useRemoveNetworkMember();
  const { formatAmount, currency } = useCurrency();
  const createFinalCalculationShareMutation = useCreateFinalCalculationShare();
  const { data: publicLinks = [] } = useNetworkFinalCalculationShares(id || '');
  const deleteFinalCalculationShareMutation = useDeleteFinalCalculationShare();
  const updateFinalCalculationShareMutation = useUpdateFinalCalculationShare();
  const [refreshingShareId, setRefreshingShareId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const memberEmails = (members || []).map(m => m.user_email);
  const { walletImages, uploadWalletImage, deleteWalletImage } = useMemberWalletImages(id || '', memberEmails);

  const network = networks?.find(n => n.id === id);
  const currentUserMember = members?.find(m => m.user_email === user?.email);
  const isAdmin = currentUserMember?.role === 'admin';

  const sortedMembers = [...(members || [])].sort((a, b) => a.user_name.localeCompare(b.user_name));

  // Fetch existing uploaded images from the network's folder in storage
  useEffect(() => {
    if (!id) return;
    const fetchExistingImages = async () => {
      const { data, error } = await supabase.storage
        .from('settlebill-images')
        .list(id, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
      if (error || !data) return;
      const imgs = data
        .filter(f => f.name && /\.(jpe?g|png|gif|webp|avif|svg)$/i.test(f.name))
        .map(f => ({
          name: f.name,
          url: supabase.storage.from('settlebill-images').getPublicUrl(`${id}/${f.name}`).data.publicUrl,
        }));
      setExistingImages(imgs);
    };
    fetchExistingImages();
  }, [id]);

  // Fetch user's gallery images from the Images app
  useEffect(() => {
    if (!user) return;
    const fetchGalleryImages = async () => {
      const { data, error } = await supabase
        .from('user_images')
        .select('id, file_path, title')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error || !data) return;
      const imgs = data.map(img => ({
        name: img.title || img.file_path.split('/').pop() || 'image',
        url: supabase.storage.from('user-images').getPublicUrl(img.file_path).data.publicUrl,
      }));
      setGalleryImages(imgs);
    };
    fetchGalleryImages();
  }, [user]);

  const toggleExistingImage = (url: string) => {
    setSelectedExistingImages(prev =>
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const toggleGalleryImage = (url: string) => {
    setSelectedGalleryImages(prev =>
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const toggleWalletImage = (url: string) => {
    setSelectedWalletImages(prev =>
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const handleWalletImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!walletUploadMemberId || !id) return;
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await uploadWalletImage.mutateAsync({ file, memberId: walletUploadMemberId, networkId: id });
    }
    setWalletUploadMemberId(null);
    if (walletImageInputRef.current) walletImageInputRef.current.value = '';
  };

  const sortedNetworkBillItems = [...(networkBillItems || [])].sort((a, b) => {
    const memberComparison = a.member_name.localeCompare(b.member_name);
    if (memberComparison !== 0) return memberComparison;

    const billComparison = a.bill_title.localeCompare(b.bill_title);
    if (billComparison !== 0) return billComparison;

    return a.item_name.localeCompare(b.item_name);
  });

  const memberItemCount = new Set(
    sortedNetworkBillItems
      .map((row) => row.member_name)
      .filter((memberName) => memberName && memberName !== 'Unassigned')
  ).size;


  const calculationResult = generateFinalAmountCalculation(
    sortedNetworkBillItems,
    (billSplits || []) as Array<BillSplitWithDetails & { payer_id?: string }>
  );
  const amountCalculationByMember = new Map(
    calculationResult.finalAmountRows.map((row) => [
      row.member,
      sortedNetworkBillItems.filter((itemRow) => itemRow.member_name === row.member && itemRow.member_id),
    ])
  );

  const handleBack = () => {
    navigate('/settlebill/networks');
  };

  const handleCreateBill = () => {
    navigate(`/settlebill/bills/create?networkId=${id}`);
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from this network?`)) {
      removeNetworkMemberMutation.mutate(
        { memberId, networkId: id || '' },
        {
          onSuccess: () => {
            toast.success('Member removed successfully');
          },
          onError: (error) => {
            console.error('Error removing member:', error);
            toast.error('Failed to remove member');
          }
        }
      );
    }
  };

  const handleExportBills = () => {
    const hasBillSplits = Boolean(billSplits && billSplits.length > 0);
    const hasFinalAmountCalculation = amountCalculationByMember.size > 0;

    if (!hasBillSplits && !hasFinalAmountCalculation) {
      toast.info('No bill data available to export for this network');
      return;
    }

    const summaryMap = new Map<string, {
      memberName: string;
      totalAmount: number;
      paidAmount: number;
      unpaidAmount: number;
      paidCount: number;
      unpaidCount: number;
    }>();

    (billSplits || []).forEach((split) => {
      const key = split.member_id;
      const current = summaryMap.get(key) || {
        memberName: split.member_name || 'Unknown Member',
        totalAmount: 0,
        paidAmount: 0,
        unpaidAmount: 0,
        paidCount: 0,
        unpaidCount: 0,
      };

      current.totalAmount += Number(split.amount || 0);

      if (split.status === 'paid') {
        current.paidAmount += Number(split.amount || 0);
        current.paidCount += 1;
      } else {
        current.unpaidAmount += Number(split.amount || 0);
        current.unpaidCount += 1;
      }

      summaryMap.set(key, current);
    });

    const summaryRows = hasBillSplits
      ? Array.from(summaryMap.values())
          .sort((a, b) => a.memberName.localeCompare(b.memberName))
          .map((entry) => ({
            member: entry.memberName,
            total: formatAmount(entry.totalAmount),
            paid: formatAmount(entry.paidAmount),
            unpaid: formatAmount(entry.unpaidAmount),
            paidBills: entry.paidCount,
            pendingBills: entry.unpaidCount,
          }))
      : [];

    const detailRows = hasBillSplits
      ? [...billSplits]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .map((split) => ({
            member: split.member_name || 'Unknown Member',
            bill: split.bill_title || 'Untitled Bill',
            payer: split.payer_name || 'Unknown',
            amount: formatAmount(Number(split.amount || 0)),
            status: split.status,
            createdAt: new Date(split.created_at).toLocaleDateString(),
          }))
      : [];

    const finalAmountRows = calculationResult.finalAmountRows
      .sort((a, b) => a.member.localeCompare(b.member))
      .map((row) => ({
        member: row.member,
        itemsOrdered: row.itemsOrdered,
        itemsSubtotal: formatAmount(row.itemsSubtotal),
        discount: row.discountShare > 0 ? formatAmount(row.discountShare) : '-',
        finalAmount: formatAmount(row.finalAmount),
      }));

    const sections: Parameters<typeof downloadStyledExcel>[0]['sections'] = [];

    if (hasBillSplits) {
      sections.push(
        {
          title: 'Member Summary',
          columns: [
            { key: 'member', label: 'Member Name', type: 'text' as const },
            { key: 'total', label: 'Total Share', type: 'currency' as const },
            { key: 'paid', label: 'Paid', type: 'currency' as const },
            { key: 'unpaid', label: 'Pending', type: 'currency' as const },
            { key: 'paidBills', label: 'Paid Bills', type: 'number' as const },
            { key: 'pendingBills', label: 'Pending Bills', type: 'number' as const },
          ],
          rows: summaryRows,
        },
        {
          title: 'Bill Split Details',
          columns: [
            { key: 'member', label: 'Member Name', type: 'text' as const },
            { key: 'bill', label: 'Bill', type: 'text' as const },
            { key: 'payer', label: 'Paid By', type: 'text' as const },
            { key: 'amount', label: 'Amount', type: 'currency' as const },
            { key: 'status', label: 'Status', type: 'text' as const },
            { key: 'createdAt', label: 'Date', type: 'date' as const },
          ],
          rows: detailRows,
        },
      );
    }

    sections.push({
      title: 'Final Amount Calculation',
      columns: [
        { key: 'member', label: 'Member', type: 'text' as const },
        { key: 'itemsOrdered', label: 'Items ordered', type: 'text' as const },
        { key: 'itemsSubtotal', label: 'Items subtotal', type: 'currency' as const },
        { key: 'discount', label: 'Discount', type: 'currency' as const },
        { key: 'finalAmount', label: 'Final amount', type: 'currency' as const },
      ],
      rows: finalAmountRows,
    });

    downloadStyledExcel({
      filename: `${network?.name || 'network'}_bills_report`,
      workbookTitle: `${network?.name || 'Network'} - Bills Export`,
      sections,
    });

    toast.success('Network bills exported successfully');
  };

  const handleExportFinalAmountCalculation = () => {
    if (calculationResult.finalAmountRows.length === 0) {
      toast.info('No final amount calculation data available to export.');
      return;
    }

    const lines: string[] = [];
    lines.push(`Network Name,${network?.name || 'Unknown Network'}`);
    lines.push(`Calculation Date,${new Date(calculationResult.calculationDate).toLocaleString()}`);
    lines.push('');

    const finalAmountCsv = convertToCSV(
      calculationResult.finalAmountRows.map((row) => ({
        Member: row.member,
        'Items ordered': row.itemsOrdered,
        'Items subtotal': row.itemsSubtotal,
        'Final amount': row.finalAmount,
      })),
      ['Member', 'Items ordered', 'Items subtotal', 'Final amount']
    );
    lines.push('Contributing Members and Amounts');
    lines.push(finalAmountCsv);
    lines.push('');

    const breakdownCsv = convertToCSV(
      calculationResult.breakdownRows.map((row) => ({
        Member: row.member,
        Payable: row.payable,
        Receivable: row.receivable,
        Net: row.net,
      })),
      ['Member', 'Payable', 'Receivable', 'Net']
    );
    lines.push('Total Payable / Receivable Breakdown');
    lines.push(breakdownCsv);
    lines.push('');

    const settlementCsv = convertToCSV(
      calculationResult.settlementRows.map((row) => ({
        From: row.from,
        To: row.to,
        Amount: row.amount,
      })),
      ['From', 'To', 'Amount']
    );
    lines.push('Final Settlement Summary');
    lines.push(settlementCsv);

    downloadCSV(lines.join('\n'), `${network?.name || 'network'}_final_amount_calculation`);
    toast.success('Final amount calculation exported as CSV.');
  };

  const [includeDefaultImages, setIncludeDefaultImages] = useState(false);
  const [selectedDefaultImages, setSelectedDefaultImages] = useState<string[]>([]);

  const HARDCODED_PAYMENT_IMAGES = [
    'https://gzampnmelaeqhwzzsvam.supabase.co/storage/v1/object/public/settlebill-images/a2b3376e-8b45-4aa8-9d8f-8c152ee05e3c/NIC.jpeg',
    'https://gzampnmelaeqhwzzsvam.supabase.co/storage/v1/object/public/settlebill-images/a2b3376e-8b45-4aa8-9d8f-8c152ee05e3c/MBL.jpeg',
    'https://gzampnmelaeqhwzzsvam.supabase.co/storage/v1/object/public/settlebill-images/a2b3376e-8b45-4aa8-9d8f-8c152ee05e3c/LXMSUN.jpeg',
    'https://gzampnmelaeqhwzzsvam.supabase.co/storage/v1/object/public/settlebill-images/a2b3376e-8b45-4aa8-9d8f-8c152ee05e3c/KHALTI.avif',
    'https://gzampnmelaeqhwzzsvam.supabase.co/storage/v1/object/public/settlebill-images/a2b3376e-8b45-4aa8-9d8f-8c152ee05e3c/ESEWA.jpeg',
  ];

  const toggleDefaultImage = (url: string) => {
    setSelectedDefaultImages(prev =>
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPendingImages(prev => [...prev, ...files]);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleRemovePendingImage = (index: number) => {
    setPendingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreatePublicLink = async () => {
    if (!id || !network || calculationResult.finalAmountRows.length === 0) {
      toast.info('No final amount calculation data available to share.');
      return;
    }

    try {
      setIsUploading(true);

      // Force refetch to ensure we capture the LATEST data from all bills
      // (avoids stale cache where new bills/items aren't yet in the calculation)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['network-bill-items', id] }),
        queryClient.invalidateQueries({ queryKey: ['network-bill-splits', id] }),
      ]);

      const [freshItemsResult, freshSplitsResult] = await Promise.all([
        queryClient.fetchQuery({ queryKey: ['network-bill-items', id] }),
        queryClient.fetchQuery({ queryKey: ['network-bill-splits', id] }),
      ]);

      const freshItems = (freshItemsResult as typeof networkBillItems) || [];
      const freshSplits = (freshSplitsResult as typeof billSplits) || [];

      const freshSortedItems = [...freshItems].sort((a, b) => {
        const memberComparison = a.member_name.localeCompare(b.member_name);
        if (memberComparison !== 0) return memberComparison;
        const billComparison = a.bill_title.localeCompare(b.bill_title);
        if (billComparison !== 0) return billComparison;
        return a.item_name.localeCompare(b.item_name);
      });

      const freshCalculation = generateFinalAmountCalculation(
        freshSortedItems,
        (freshSplits || []) as Array<BillSplitWithDetails & { payer_id?: string }>
      );

      // Upload new images first
      const imageUrls: string[] = [];
      for (const file of pendingImages) {
        const fileName = `${id}/${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('settlebill-images')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Image upload failed:', uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('settlebill-images')
          .getPublicUrl(uploadData.path);

        imageUrls.push(urlData.publicUrl);
      }

      // Add selected existing uploaded images
      if (selectedExistingImages.length > 0) {
        imageUrls.push(...selectedExistingImages);
      }

      // Add selected gallery images
      if (selectedGalleryImages.length > 0) {
        imageUrls.push(...selectedGalleryImages);
      }

      // Add selected wallet images
      if (selectedWalletImages.length > 0) {
        imageUrls.push(...selectedWalletImages);
      }

      // Add selected default payment images
      if (includeDefaultImages && selectedDefaultImages.length > 0) {
        imageUrls.push(...selectedDefaultImages);
      }

      // Fetch all profiles with avatars for member avatar display
      const memberAvatars: Record<string, string> = {};
      if (includeDefaultImages && members && members.length > 0) {
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('id, avatar_url, first_name, last_name')
          .not('avatar_url', 'is', null);
        
        if (allProfiles) {
          for (const profile of allProfiles) {
            if (profile.avatar_url) {
              const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
              // Match by name to member names in the network
              for (const member of members) {
                if (member.user_name && (
                  member.user_name.toLowerCase() === fullName.toLowerCase() ||
                  member.user_name.toLowerCase().includes((profile.first_name || '').toLowerCase())
                )) {
                  memberAvatars[member.user_name] = profile.avatar_url;
                }
              }
            }
          }
        }
      }

      const result = await createFinalCalculationShareMutation.mutateAsync({
        networkId: id,
        payload: {
          networkName: network.name,
          calculationDate: freshCalculation.calculationDate,
          imageUrls,
          memberAvatars,
          currencyCode: currency.code,
          currencySymbol: currency.symbol,
          finalAmountRows: freshCalculation.finalAmountRows,
          breakdownRows: freshCalculation.breakdownRows,
          settlementRows: freshCalculation.settlementRows,
          totals: freshCalculation.totals,
        },
      });

      const publicUrl = `${window.location.origin}/final-calculation/${result.share_id}`;
      queryClient.setQueryData(['public-final-calculation-share', result.share_id], result);
      await navigator.clipboard.writeText(publicUrl);
      setPendingImages([]);
      setSelectedExistingImages([]);
      setSelectedGalleryImages([]);
      setSelectedWalletImages([]);
      toast.success('Public link created and copied to clipboard.');
    } catch (error) {
      console.error('Failed to create public share link:', error);
      toast.error('Failed to create public link.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRefreshPublicLink = async (link: typeof publicLinks[number]) => {
    if (!id) return;
    try {
      setRefreshingShareId(link.id);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['network-bill-items', id] }),
        queryClient.invalidateQueries({ queryKey: ['network-bill-splits', id] }),
      ]);

      const [freshItemsResult, freshSplitsResult] = await Promise.all([
        queryClient.fetchQuery({ queryKey: ['network-bill-items', id] }),
        queryClient.fetchQuery({ queryKey: ['network-bill-splits', id] }),
      ]);

      const freshItems = (freshItemsResult as typeof networkBillItems) || [];
      const freshSplits = (freshSplitsResult as typeof billSplits) || [];

      const freshSortedItems = [...freshItems].sort((a, b) => {
        const memberComparison = a.member_name.localeCompare(b.member_name);
        if (memberComparison !== 0) return memberComparison;
        const billComparison = a.bill_title.localeCompare(b.bill_title);
        if (billComparison !== 0) return billComparison;
        return a.item_name.localeCompare(b.item_name);
      });

      const freshCalculation = generateFinalAmountCalculation(
        freshSortedItems,
        (freshSplits || []) as Array<BillSplitWithDetails & { payer_id?: string }>
      );

      const existingPayload = link.payload || ({} as any);

      await updateFinalCalculationShareMutation.mutateAsync({
        id: link.id,
        networkId: id,
        payload: {
          networkName: network?.name || existingPayload.networkName || '',
          calculationDate: freshCalculation.calculationDate,
          imageUrls: existingPayload.imageUrls || [],
          memberAvatars: existingPayload.memberAvatars || {},
          currencyCode: currency.code,
          currencySymbol: currency.symbol,
          finalAmountRows: freshCalculation.finalAmountRows,
          breakdownRows: freshCalculation.breakdownRows,
          settlementRows: freshCalculation.settlementRows,
          totals: freshCalculation.totals,
        },
      });

      toast.success('Shared link refreshed with latest totals.');
    } catch (error) {
      console.error('Failed to refresh public share link:', error);
      toast.error('Failed to refresh public link.');
    } finally {
      setRefreshingShareId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4 md:p-6">
        <div className="text-center py-8">Loading network details...</div>
      </div>
    );
  }

  if (!network) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4 md:p-6">
        <div className="text-center py-8">Network not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBack} className="flex-shrink-0 hover:bg-orange-100 dark:hover:bg-orange-900">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl md:text-2xl font-bold truncate">{network.name}</h2>
              <p className="text-gray-600 text-sm md:text-base">{members?.length || 0} members</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleCreateBill} className="bg-red-600 hover:bg-red-700 flex-1 sm:flex-none">
              <Receipt className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">Create Bill</span>
              <span className="xs:hidden">Bill</span>
            </Button>
            <Button variant="outline" onClick={handleExportBills} className="flex-1 sm:flex-none border-red-200 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">Export Excel</span>
              <span className="xs:hidden">Export</span>
            </Button>
            {isAdmin && (
              <>
                <Button variant="outline" size="sm" className="hidden md:flex border-red-200 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button onClick={() => setShowAddMember(true)} size="sm" className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  <span className="hidden xs:inline">Add Member</span>
                  <span className="xs:hidden">Add</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {showAddMember && (
          <AddMemberForm 
            networkId={id || ''}
            networkName={network.name}
            onClose={() => setShowAddMember(false)}
            onSuccess={() => {
              // Refresh members list
            }}
          />
        )}

        <Card className="border border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Users className="w-5 h-5" />
              Network Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members && members.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead className="text-right">Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="flex-shrink-0">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user_email}`} />
                            <AvatarFallback>{member.user_name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium truncate">{member.user_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{member.user_email}</TableCell>
                      <TableCell>
                        <Badge variant={member.role === 'admin' ? 'default' : 'outline'} className="text-xs">
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                          {member.status}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex-shrink-0"
                                  title="Manage wallet images"
                                >
                                  <Wallet className="w-4 h-4 text-muted-foreground" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg">
                                <DialogHeader>
                                  <DialogTitle>Wallet Images - {member.user_name}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setWalletUploadMemberId(member.id);
                                      walletImageInputRef.current?.click();
                                    }}
                                    disabled={uploadWalletImage.isPending}
                                    className="bg-primary hover:bg-primary/90"
                                  >
                                    <Upload className="w-4 h-4 mr-1" />
                                    {uploadWalletImage.isPending ? 'Uploading...' : 'Upload Image'}
                                  </Button>
                                  <div className="flex flex-wrap gap-2">
                                    {walletImages
                                      .filter(img => img.member_email === member.user_email || img.member_id === member.id)
                                      .map(img => (
                                        <div key={img.id} className="relative group">
                                          <img src={img.url} alt={img.file_name} className="w-20 h-20 object-cover rounded-md border" />
                                          <button
                                            onClick={() => deleteWalletImage.mutate(img)}
                                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                    {walletImages.filter(img => img.member_email === member.user_email || img.member_id === member.id).length === 0 && (
                                      <p className="text-sm text-muted-foreground">No wallet images yet.</p>
                                    )}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            {member.user_email !== user?.email && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(member.id, member.user_name)}
                                disabled={removeNetworkMemberMutation.isPending}
                                className="flex-shrink-0"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm md:text-base">No members yet. Add the first member to this network!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Member Item Details</CardTitle>
            <p className="text-sm text-muted-foreground">Members total: {memberItemCount}</p>
          </CardHeader>
          <CardContent>
            {isLoadingItems ? (
              <div className="text-center py-6 text-muted-foreground">Loading member item details...</div>
            ) : (() => {
              // Build rows for non-itemized bills from splits
              const billIdsWithItems = new Set((networkBillItems || []).map(r => r.bill_id));
              const nonItemizedSplits = (billSplits || []).filter(s => !billIdsWithItems.has(s.bill_id));
              const hasItems = networkBillItems && networkBillItems.length > 0;
              const hasNonItemizedSplits = nonItemizedSplits.length > 0;

              if (!hasItems && !hasNonItemizedSplits) {
                return <div className="text-center py-6 text-muted-foreground">No bill items found for this network.</div>;
              }

              return (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Bill</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Consumed Qty</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Item Total</TableHead>
                      <TableHead className="text-right">Member Share</TableHead>
                      <TableHead className="text-right">Bill Discount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedNetworkBillItems.map((row) => (
                      <TableRow key={`${row.item_id}-${row.member_id || 'unassigned'}`}>
                        <TableCell className="font-medium">{row.member_name}</TableCell>
                        <TableCell>{row.bill_title}</TableCell>
                        <TableCell>{row.item_name}</TableCell>
                        <TableCell className="text-right">{row.consumed_quantity}</TableCell>
                        <TableCell className="text-right">{formatAmount(Number(row.rate || 0))}</TableCell>
                        <TableCell className="text-right">{formatAmount(Number(row.amount || 0))}</TableCell>
                        <TableCell className="text-right font-semibold">{formatAmount(Number(row.share_amount || 0))}</TableCell>
                        <TableCell className="text-right text-green-600">
                          {row.bill_discount_amount > 0 ? `-${formatAmount(row.bill_discount_amount)}` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {nonItemizedSplits.map((split: any, idx: number) => {
                      const splitAmount = Number(split.amount || 0);
                      return (
                        <TableRow key={`non-itemized-${split.id || idx}`}>
                          <TableCell className="font-medium">{split.member_name}</TableCell>
                          <TableCell>{split.bill_title}</TableCell>
                          <TableCell className="italic text-muted-foreground">Split share</TableCell>
                          <TableCell className="text-right">1</TableCell>
                          <TableCell className="text-right">{formatAmount(splitAmount)}</TableCell>
                          <TableCell className="text-right">{formatAmount(splitAmount)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatAmount(splitAmount)}</TableCell>
                          <TableCell className="text-right">-</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              );
            })()}
          </CardContent>
        </Card>

        <Card className="border border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Final Amount Calculation</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleExportFinalAmountCalculation} className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900">
                Export Final Amount Calculation
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreatePublicLink}
                  disabled={createFinalCalculationShareMutation.isPending || isUploading}
                  className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
                >
                  <Link2 className="w-4 h-4 mr-1" />
                  {isUploading ? 'Uploading...' : 'Create Public Link'}
                </Button>
                <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer">
                  <Checkbox
                    checked={includeDefaultImages}
                    onCheckedChange={(checked) => setIncludeDefaultImages(checked === true)}
                  />
                  Include payment images
                </label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => imageInputRef.current?.click()}
                className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
              >
                <ImagePlus className="w-4 h-4 mr-1" />
                Add Images
              </Button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>
            {/* Selectable default payment images */}
            {includeDefaultImages && (
              <div className="mt-3">
                <p className="text-sm font-medium text-muted-foreground mb-2">Select payment images to include:</p>
                <div className="flex flex-wrap gap-2">
                  {HARDCODED_PAYMENT_IMAGES.map((url) => {
                    const isSelected = selectedDefaultImages.includes(url);
                    const label = url.split('/').pop()?.split('.')[0] || '';
                    return (
                      <button
                        key={url}
                        type="button"
                        onClick={() => toggleDefaultImage(url)}
                        className={`relative w-20 h-20 rounded-md border-2 overflow-hidden transition-all ${isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-muted opacity-60 hover:opacity-100'}`}
                      >
                        <img src={url} alt={label} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <Check className="w-6 h-6 text-primary-foreground drop-shadow" />
                          </div>
                        )}
                        <span className="absolute bottom-0 left-0 right-0 bg-background/80 text-[10px] text-center truncate px-0.5">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Pending images preview */}
            {pendingImages.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-muted-foreground mb-2">New images to upload ({pendingImages.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {pendingImages.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-20 h-20 object-cover rounded-md border"
                      />
                      <button
                        onClick={() => handleRemovePendingImage(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Browse existing uploaded images */}
            {existingImages.length > 0 && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExistingImages(prev => !prev)}
                  className="mb-2 border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900"
                >
                  {showExistingImages ? 'Hide' : 'Select from'} uploaded images ({existingImages.length})
                </Button>
                {showExistingImages && (
                  <div className="flex flex-wrap gap-2">
                    {existingImages.map((img) => {
                      const isSelected = selectedExistingImages.includes(img.url);
                      return (
                        <button
                          key={img.url}
                          type="button"
                          onClick={() => toggleExistingImage(img.url)}
                          className={`relative w-20 h-20 rounded-md border-2 overflow-hidden transition-all ${isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-muted opacity-60 hover:opacity-100'}`}
                        >
                          <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                          {isSelected && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <Check className="w-6 h-6 text-primary-foreground drop-shadow" />
                            </div>
                          )}
                          <span className="absolute bottom-0 left-0 right-0 bg-background/80 text-[10px] text-center truncate px-0.5">{img.name.split('.')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {selectedExistingImages.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">{selectedExistingImages.length} image(s) selected</p>
                )}
              </div>
            )}
            {/* Browse gallery images from Images app */}
            {galleryImages.length > 0 && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGalleryImages(prev => !prev)}
                  className="mb-2 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
                >
                  <Image className="w-4 h-4 mr-1" />
                  {showGalleryImages ? 'Hide' : 'Select from'} my gallery ({galleryImages.length})
                </Button>
                {showGalleryImages && (
                  <div className="flex flex-wrap gap-2">
                    {galleryImages.map((img) => {
                      const isSelected = selectedGalleryImages.includes(img.url);
                      return (
                        <button
                          key={img.url}
                          type="button"
                          onClick={() => toggleGalleryImage(img.url)}
                          className={`relative w-20 h-20 rounded-md border-2 overflow-hidden transition-all ${isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-muted opacity-60 hover:opacity-100'}`}
                        >
                          <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                          {isSelected && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <Check className="w-6 h-6 text-primary-foreground drop-shadow" />
                            </div>
                          )}
                          <span className="absolute bottom-0 left-0 right-0 bg-background/80 text-[10px] text-center truncate px-0.5">{img.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {selectedGalleryImages.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">{selectedGalleryImages.length} gallery image(s) selected</p>
                )}
              </div>
            )}
            {/* Wallet images from payers + optionally other members */}
            {(() => {
              const payerMemberIds = new Set((billSplits || []).map((s: any) => s.payer_id).filter(Boolean));
              const payerMembers = sortedMembers.filter(m => payerMemberIds.has(m.id));
              const nonPayerMembers = sortedMembers.filter(m => !payerMemberIds.has(m.id));
              const payerWalletImages = walletImages.filter(img => 
                payerMembers.some(m => img.member_email === m.user_email || img.member_id === m.id)
              );
              // Also include wallets from additionally selected members
              const additionalWalletImages = walletImages.filter(img =>
                (additionalWalletMemberIds || []).some((mid: string) => {
                  const member = sortedMembers.find(m => m.id === mid);
                  return member && (img.member_email === member.user_email || img.member_id === member.id);
                })
              );
              const totalWalletCount = payerWalletImages.length + additionalWalletImages.length;
              if (payerWalletImages.length === 0 && nonPayerMembers.length === 0) return null;
              return (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowWalletImages(prev => !prev)}
                  className="mb-2 border-green-200 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900"
                >
                  <Wallet className="w-4 h-4 mr-1" />
                  {showWalletImages ? 'Hide' : 'Select from'} wallet images ({totalWalletCount})
                </Button>
                {showWalletImages && (
                  <div className="space-y-3">
                    {payerMembers.map(member => {
                      const memberWallets = walletImages.filter(img => img.member_email === member.user_email || img.member_id === member.id);
                      if (memberWallets.length === 0) return null;
                      return (
                        <div key={member.id}>
                          <p className="text-xs font-medium text-muted-foreground mb-1">{member.user_name} <Badge variant="secondary" className="text-[10px] ml-1">Payer</Badge></p>
                          <div className="flex flex-wrap gap-2">
                            {memberWallets.map(img => {
                              const isSelected = selectedWalletImages.includes(img.url);
                              return (
                                <button
                                  key={img.id}
                                  type="button"
                                  onClick={() => toggleWalletImage(img.url)}
                                  className={`relative w-20 h-20 rounded-md border-2 overflow-hidden transition-all ${isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-muted opacity-60 hover:opacity-100'}`}
                                >
                                  <img src={img.url} alt={img.file_name} className="w-full h-full object-cover" />
                                  {isSelected && (
                                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                      <Check className="w-6 h-6 text-primary-foreground drop-shadow" />
                                    </div>
                                  )}
                                  <span className="absolute bottom-0 left-0 right-0 bg-background/80 text-[10px] text-center truncate px-0.5">{img.file_name.split('.')[0]}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    {/* Additional selected members' wallets */}
                    {(additionalWalletMemberIds || []).map((mid: string) => {
                      const member = sortedMembers.find(m => m.id === mid);
                      if (!member) return null;
                      const memberWallets = walletImages.filter(img => img.member_email === member.user_email || img.member_id === member.id);
                      if (memberWallets.length === 0) return null;
                      return (
                        <div key={member.id}>
                          <p className="text-xs font-medium text-muted-foreground mb-1">{member.user_name}</p>
                          <div className="flex flex-wrap gap-2">
                            {memberWallets.map(img => {
                              const isSelected = selectedWalletImages.includes(img.url);
                              return (
                                <button
                                  key={img.id}
                                  type="button"
                                  onClick={() => toggleWalletImage(img.url)}
                                  className={`relative w-20 h-20 rounded-md border-2 overflow-hidden transition-all ${isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-muted opacity-60 hover:opacity-100'}`}
                                >
                                  <img src={img.url} alt={img.file_name} className="w-full h-full object-cover" />
                                  {isSelected && (
                                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                      <Check className="w-6 h-6 text-primary-foreground drop-shadow" />
                                    </div>
                                  )}
                                  <span className="absolute bottom-0 left-0 right-0 bg-background/80 text-[10px] text-center truncate px-0.5">{img.file_name.split('.')[0]}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    {/* Add other members' wallets */}
                    {nonPayerMembers.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Add other member wallets:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {nonPayerMembers.map(member => {
                            const isAdded = (additionalWalletMemberIds || []).includes(member.id);
                            const memberHasWallets = walletImages.some(img => img.member_email === member.user_email || img.member_id === member.id);
                            if (!memberHasWallets) return null;
                            return (
                              <Badge
                                key={member.id}
                                variant={isAdded ? 'default' : 'outline'}
                                className="cursor-pointer text-xs"
                                onClick={() => {
                                  setAdditionalWalletMemberIds(prev => 
                                    prev.includes(member.id) 
                                      ? prev.filter(id => id !== member.id) 
                                      : [...prev, member.id]
                                  );
                                }}
                              >
                                {isAdded ? <Check className="w-3 h-3 mr-1" /> : <UserPlus className="w-3 h-3 mr-1" />}
                                {member.user_name}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {selectedWalletImages.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">{selectedWalletImages.length} wallet image(s) selected</p>
                )}
              </div>
              );
            })()}
            {/* Hidden input for wallet image uploads */}
            <input
              ref={walletImageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleWalletImageUpload}
            />
            {/* Public links list */}
            {publicLinks.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Shared Links:</p>
                {publicLinks.map((link) => {
                  const publicUrl = `${window.location.origin}/final-calculation/${link.share_id}`;
                  return (
                    <div key={link.id} className="flex items-center gap-2 text-sm bg-muted/50 rounded-md px-3 py-2">
                      <Link2 className="w-3 h-3 flex-shrink-0 text-muted-foreground" />
                      <span className="truncate flex-1 text-muted-foreground">{publicUrl}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => handleRefreshPublicLink(link)}
                        disabled={refreshingShareId === link.id}
                        title="Refresh with latest totals"
                      >
                        <RefreshCw className={`w-3 h-3 ${refreshingShareId === link.id ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => {
                          navigator.clipboard.writeText(publicUrl);
                          toast.success('Link copied!');
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (window.confirm('Delete this public link?')) {
                            deleteFinalCalculationShareMutation.mutate(
                              { id: link.id, networkId: id || '' },
                              {
                                onSuccess: () => toast.success('Public link deleted'),
                                onError: () => toast.error('Failed to delete link'),
                              }
                            );
                          }
                        }}
                        disabled={deleteFinalCalculationShareMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {calculationResult.finalAmountRows.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">No final amount calculation data available.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Items ordered</TableHead>
                    <TableHead className="text-right">Items subtotal</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Final amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculationResult.finalAmountRows
                    .sort((a, b) => a.member.localeCompare(b.member))
                    .map((row) => {
                      const billIdsWithItems = new Set((networkBillItems || []).map((itemRow) => itemRow.bill_id));
                      const memberRows = sortedNetworkBillItems.filter((itemRow) => itemRow.member_name === row.member && itemRow.member_id);
                      const nonItemizedMemberSplits = (billSplits || []).filter(
                        (split) => split.member_name === row.member && !billIdsWithItems.has(split.bill_id)
                      );
                      return (
                        <TableRow key={row.member}>
                          <TableCell className="font-semibold">{row.member}</TableCell>
                          <TableCell>
                            <div className="space-y-3">
                              {memberRows.length > 0 ? memberRows.map((itemRow, index) => (
                                <div key={`${itemRow.item_id}-${index}`} className="space-y-1">
                                  <p className="font-medium">{itemRow.item_name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {itemRow.consumed_quantity} / {itemRow.quantity} qty × {formatAmount(Number(itemRow.rate || 0))} = {formatAmount(Number(itemRow.share_amount || 0))}
                                  </p>
                                  <p className="text-sm font-semibold">{formatAmount(Number(itemRow.share_amount || 0))}</p>
                                </div>
                              )) : nonItemizedMemberSplits.length === 0 ? (
                                <p className="text-sm italic text-muted-foreground">{row.itemsOrdered || 'Split share'}</p>
                              ) : null}

                              {nonItemizedMemberSplits.map((split, index) => {
                                const splitAmount = Number(split.amount || 0);
                                return (
                                  <div key={`split-share-${split.id || `${split.bill_id}-${index}`}`} className="space-y-1">
                                    <p className="font-medium">{split.bill_title || 'Split share'}</p>
                                    <p className="text-sm text-muted-foreground">
                                      1 / 1 qty × {formatAmount(splitAmount)} = {formatAmount(splitAmount)}
                                    </p>
                                    <p className="text-sm font-semibold">{formatAmount(splitAmount)}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatAmount(row.itemsSubtotal)}</TableCell>
                          <TableCell className="text-right text-green-600">
                            {row.discountShare > 0 ? `-${formatAmount(row.discountShare)}` : '-'}
                          </TableCell>
                          <TableCell className="text-right font-semibold">{formatAmount(row.finalAmount)}</TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
