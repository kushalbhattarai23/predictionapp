
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { RequireSettleBillEnabled } from '@/components/Auth/RequireSettleBillEnabled';
import { OverviewPage } from './OverviewPage';
import { NetworksPage } from './NetworksPage';
import { BillsPage } from './BillsPage';

import { CreateNetworkPage } from './CreateNetworkPage';
import { NetworkDetailPage } from './NetworkDetailPage';
import { CreateBillPage } from './CreateBillPage';
import { BillDetailPage } from './BillDetailPage';
import { BillEditPage } from './BillEditPage';
import { ItemizedBillPage } from './ItemizedBillPage';
import { FinalCalculationsPage } from './FinalCalculationsPage';

export const SettleBillApp: React.FC = () => {
  return (
    <RequireSettleBillEnabled>
      <div className="min-h-screen flex bg-gradient-to-br from-orange-50 to-amber-50 w-full">
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/networks" element={<NetworksPage />} />
              <Route path="/networks/create" element={<CreateNetworkPage />} />
              <Route path="/networks/:id" element={<NetworkDetailPage />} />
              <Route path="/bills" element={<BillsPage />} />
              <Route path="/bills/create" element={<CreateBillPage />} />
              <Route path="/bills/itemized" element={<ItemizedBillPage />} />
              <Route path="/bills/:id/edit" element={<BillEditPage />} />
              <Route path="/bills/:id" element={<BillDetailPage />} />
              
              <Route path="/final-calculations" element={<FinalCalculationsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </RequireSettleBillEnabled>
  );
};
