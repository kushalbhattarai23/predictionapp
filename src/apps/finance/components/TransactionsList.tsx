
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { ArrowUpRight, ArrowLeftRight } from 'lucide-react';
import { UnifiedTransactionCard } from './UnifiedTransactionCard';

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
  created_at: string;
}

interface TransactionsListProps {
  currentItems: UnifiedTransaction[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEditTransaction: (item: UnifiedTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onEditTransfer: (item: UnifiedTransaction) => void;
  onDeleteTransfer: (id: string) => void;
  getWalletName: (walletId: string) => string;
  getCategoryName: (categoryId: string) => string;
  getCategoryColor: (categoryId: string) => string;
  transactions: any[];
  transfers: any[];
  runningBalances?: Map<string, number>;
  previousBalances?: Map<string, number>;
  toWalletRunningBalances?: Map<string, number>;
  toWalletPreviousBalances?: Map<string, number>;
}

export const TransactionsList: React.FC<TransactionsListProps> = ({
  currentItems,
  currentPage,
  totalPages,
  onPageChange,
  onEditTransaction,
  onDeleteTransaction,
  onEditTransfer,
  onDeleteTransfer,
  getWalletName,
  getCategoryName,
  getCategoryColor,
  transactions,
  transfers,
  runningBalances,
  previousBalances,
  toWalletRunningBalances,
  toWalletPreviousBalances
}) => {
  const handleEdit = (item: UnifiedTransaction) => {
    if (item.type === 'transfer') {
      const transfer = transfers.find(t => t.id === item.id);
      onEditTransfer(transfer);
    } else {
      const transaction = transactions.find(t => t.id === item.id);
      onEditTransaction(transaction);
    }
  };

  const handleDelete = (id: string, type: 'transaction' | 'transfer') => {
    if (type === 'transfer') {
      onDeleteTransfer(id);
    } else {
      onDeleteTransaction(id);
    }
  };

  if (currentItems.length === 0) {
    return (
      <Card className="border-green-200">
        <CardContent className="text-center py-12">
          <div className="flex justify-center space-x-4 mb-4">
            <ArrowUpRight className="h-8 w-8 text-green-500" />
            <ArrowLeftRight className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
          <p className="text-muted-foreground mb-4">Create your first transaction or transfer</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {currentItems.map((item) => (
        <UnifiedTransactionCard
          key={`${item.type}-${item.id}`}
          item={item}
          onEdit={handleEdit}
          onDelete={(id) => handleDelete(id, item.type)}
          getWalletName={getWalletName}
          getCategoryName={getCategoryName}
          getCategoryColor={getCategoryColor}
          runningBalance={runningBalances?.get(`${item.type}-${item.id}`)}
          previousBalance={previousBalances?.get(`${item.type}-${item.id}`)}
          toWalletRunningBalance={toWalletRunningBalances?.get(`${item.type}-${item.id}`)}
          toWalletPreviousBalance={toWalletPreviousBalances?.get(`${item.type}-${item.id}`)}
        />
      ))}

      {totalPages > 1 && (
        <Card className="border-green-200">
          <CardContent className="p-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) onPageChange(currentPage - 1);
                    }}
                    className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                
                {(() => {
                  const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    const windowSize = 5;
                    let start = Math.max(2, currentPage - Math.floor(windowSize / 2));
                    let end = start + windowSize - 1;
                    if (end >= totalPages) {
                      end = totalPages - 1;
                      start = Math.max(2, end - windowSize + 1);
                    }
                    pages.push(1);
                    if (start > 2) pages.push('ellipsis-start');
                    for (let i = start; i <= end; i++) pages.push(i);
                    if (end < totalPages - 1) pages.push('ellipsis-end');
                    pages.push(totalPages);
                  }
                  return pages.map((page, idx) => {
                    if (page === 'ellipsis-start' || page === 'ellipsis-end') {
                      return (
                        <PaginationItem key={page}>
                          <span className="flex h-9 w-9 items-center justify-center">…</span>
                        </PaginationItem>
                      );
                    }
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => { e.preventDefault(); onPageChange(page); }}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  });
                })()}
                
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) onPageChange(currentPage + 1);
                    }}
                    className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
