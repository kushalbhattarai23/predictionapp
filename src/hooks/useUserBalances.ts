
import { useQuery } from '@tanstack/react-query';
import { useBills } from '@/hooks/useSettleGaraBills';
import { useBillSplits } from '@/hooks/useSettleGaraBillSplits';
import { useNetworkMembers } from '@/hooks/useSettleBillNetworks';
import { useAuth } from '@/hooks/useAuth';

export const useUserBalances = () => {
  const { user } = useAuth();
  const { data: bills } = useBills();
  
  return useQuery({
    queryKey: ['user-balances', user?.email],
    queryFn: async () => {
      if (!bills || !user?.email) return { totalOwed: 0, totalOwing: 0 };
      
      let totalOwed = 0; // Money others owe to you
      let totalOwing = 0; // Money you owe to others
      
      for (const bill of bills) {
        try {
          // Get network members to find current user's member ID
          const { data: members } = await useNetworkMembers(bill.network_id);
          const currentUserMember = members?.find(m => m.user_email === user.email);
          
          if (currentUserMember) {
            const { data: splits } = await useBillSplits(bill.id);
            const userSplit = splits?.find(s => s.member_id === currentUserMember.id);
            
            if (userSplit && userSplit.status === 'unpaid') {
              totalOwing += Number(userSplit.amount);
            }
            
            // If user created the bill, calculate what others owe
            if (bill.created_by === user.id) {
              const otherSplits = splits?.filter(s => s.member_id !== currentUserMember.id && s.status === 'unpaid') || [];
              totalOwed += otherSplits.reduce((sum, split) => sum + Number(split.amount), 0);
            }
          }
        } catch (error) {
          console.error('Error calculating balances for bill:', bill.id, error);
        }
      }
      
      return { totalOwed, totalOwing };
    },
    enabled: !!bills && !!user?.email,
  });
};
