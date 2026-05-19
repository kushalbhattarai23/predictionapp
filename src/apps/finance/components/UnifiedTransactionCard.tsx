
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, Edit, Trash2, Wallet } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { useCalendarMode, formatDateByMode } from '@/apps/finance/hooks/useCalendarMode';

interface UnifiedTransaction {
  id: string;
  type: 'transaction' | 'transfer';
  subtype?: 'income' | 'expense';
  reason?: string;
  description?: string;
  amount: number;
  wallet_id?: string;
  from_wallet_id?: string;
  to_wallet_id?: string;
  category_id?: string;
  date: string;
  nepali_date?: string;
  created_at: string;
}

interface UnifiedTransactionCardProps {
  item: UnifiedTransaction;
  onEdit: (item: UnifiedTransaction) => void;
  onDelete: (id: string) => void;
  getWalletName: (walletId: string) => string;
  getCategoryName: (categoryId: string) => string;
  getCategoryColor: (categoryId: string) => string;
  runningBalance?: number;
  previousBalance?: number;
  toWalletRunningBalance?: number;
  toWalletPreviousBalance?: number;
}

export const UnifiedTransactionCard: React.FC<UnifiedTransactionCardProps> = ({
  item,
  onEdit,
  onDelete,
  getWalletName,
  getCategoryName,
  getCategoryColor,
  runningBalance,
  previousBalance,
  toWalletRunningBalance,
  toWalletPreviousBalance
}) => {
  const navigate = useNavigate();
  const { formatAmount } = useCurrency();
  const { mode } = useCalendarMode();

  return (
    <Card key={`${item.type}-${item.id}`} className="border-green-200">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {item.type === 'transfer' ? (
                <ArrowLeftRight className="h-8 w-8 text-blue-600" />
              ) : item.subtype === 'income' ? (
                <ArrowUpRight className="h-8 w-8 text-green-500" />
              ) : (
                <ArrowDownRight className="h-8 w-8 text-red-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <Badge variant={
                  item.type === 'transfer' ? 'secondary' :
                  item.subtype === 'income' ? 'default' : 'destructive'
                }>
                  {item.type === 'transfer' ? 'Transfer' : item.subtype}
                </Badge>
                {item.type === 'transaction' && (
                  <Badge variant="outline" className="cursor-pointer" onClick={() => navigate(`/finance/wallet/${item.wallet_id}`)}>
                    <Wallet className="h-3 w-3 mr-1" />
                    {getWalletName(item.wallet_id!)}
                  </Badge>
                )}
              </div>
              <p className="font-semibold text-green-700 truncate">
                {item.type === 'transfer' 
                  ? `${getWalletName(item.from_wallet_id!)} → ${getWalletName(item.to_wallet_id!)}`
                  : item.reason
                }
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {item.type === 'transfer' ? item.description : ''}
              </p>
              <div className="flex items-center space-x-4 mt-1">
                <p className="text-sm text-muted-foreground">
                  {formatDateByMode(item.date, item.nepali_date, mode)}
                </p>
                {item.type === 'transaction' && item.category_id && (
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-gray-100" 
                    style={{ borderColor: getCategoryColor(item.category_id), color: getCategoryColor(item.category_id) }}
                    onClick={() => navigate(`/finance/categories/${encodeURIComponent(getCategoryName(item.category_id).toLowerCase())}`)}
                  >
                    {getCategoryName(item.category_id)}
                  </Badge>
                )}
                {item.type === 'transfer' && (
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="cursor-pointer" onClick={() => navigate(`/finance/wallet/${item.from_wallet_id}`)}>
                      <Wallet className="h-3 w-3 mr-1" />
                      {getWalletName(item.from_wallet_id!)}
                    </Badge>
                    <span>→</span>
                    <Badge variant="outline" className="cursor-pointer" onClick={() => navigate(`/finance/wallet/${item.to_wallet_id}`)}>
                      <Wallet className="h-3 w-3 mr-1" />
                      {getWalletName(item.to_wallet_id!)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="text-left sm:text-right">
              <p className={`text-xl font-bold ${
                item.type === 'transfer' ? 'text-blue-700' :
                item.subtype === 'income' ? 'text-green-700' : 'text-red-700'
              }`}>
                {item.type === 'transaction' && item.subtype === 'income' ? '+' : 
                 item.type === 'transaction' && item.subtype === 'expense' ? '-' : ''}
                {formatAmount(item.amount)}
              </p>
              {previousBalance !== undefined && runningBalance !== undefined && (
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {item.type === 'transfer' ? (
                    <>
                      <p>{getWalletName(item.from_wallet_id!)}: {formatAmount(previousBalance)} → {formatAmount(runningBalance)}</p>
                      {toWalletPreviousBalance !== undefined && toWalletRunningBalance !== undefined && (
                        <p>{getWalletName(item.to_wallet_id!)}: {formatAmount(toWalletPreviousBalance)} → {formatAmount(toWalletRunningBalance)}</p>
                      )}
                    </>
                  ) : (
                    <p>{formatAmount(previousBalance)} → {formatAmount(runningBalance)}</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex space-x-1">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => onEdit(item)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
