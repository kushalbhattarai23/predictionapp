
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Plus, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useOrganizationContext } from '@/contexts/OrganizationContext';

export const Companies: React.FC = () => {
  const { formatAmount } = useCurrency();
  const { organizations, isLoading } = useOrganizations();
  const { setCurrentOrganization } = useOrganizationContext();

  const handleViewCompany = (organization: any) => {
    setCurrentOrganization(organization);
    // Navigate to finance dashboard to see company-specific view
    window.location.href = '/finance';
  };

  // Mock financial data for each company - in a real app, this would come from transactions filtered by organization
  const getCompanyFinancials = (orgId: string) => {
    // This is mock data - in reality, you'd filter transactions by organization_id
    return {
      totalIncome: Math.floor(Math.random() * 100000) + 50000,
      totalExpenses: Math.floor(Math.random() * 80000) + 30000,
    };
  };

  const companiesWithFinancials = organizations.map(org => {
    const financials = getCompanyFinancials(org.id);
    return {
      ...org,
      ...financials,
      netProfit: financials.totalIncome - financials.totalExpenses,
      status: financials.totalIncome > financials.totalExpenses ? 'profitable' : 'loss'
    };
  });

  const totalIncome = companiesWithFinancials.reduce((sum, company) => sum + company.totalIncome, 0);
  const totalExpenses = companiesWithFinancials.reduce((sum, company) => sum + company.totalExpenses, 0);
  const totalNetProfit = totalIncome - totalExpenses;

  if (isLoading) {
    return <div className="text-center py-8">Loading companies...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-blue-700">Companies</h1>
          <p className="text-muted-foreground">Manage and track your business entities</p>
        </div>
      </div>

      {/* Overview Cards */}
      {companiesWithFinancials.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{formatAmount(totalIncome)}</div>
              <p className="text-xs text-muted-foreground">Across all companies</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">{formatAmount(totalExpenses)}</div>
              <p className="text-xs text-muted-foreground">Across all companies</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Net Profit</CardTitle>
              <Building className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalNetProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatAmount(totalNetProfit)}
              </div>
              <p className="text-xs text-muted-foreground">Total across all companies</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Companies List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-blue-700">Your Companies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companiesWithFinancials.map((company) => (
            <Card key={company.id} className="border-blue-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-blue-700">{company.name}</CardTitle>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    company.status === 'profitable' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {company.status === 'profitable' ? 'Profitable' : 'Loss'}
                  </div>
                </div>
                {company.description && (
                  <p className="text-sm text-muted-foreground">{company.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Income</span>
                    <span className="font-medium text-green-600">{formatAmount(company.totalIncome)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expenses</span>
                    <span className="font-medium text-red-600">{formatAmount(company.totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="font-medium">Net Profit</span>
                    <span className={`font-bold ${company.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatAmount(company.netProfit)}
                    </span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleViewCompany({
                    id: company.id,
                    name: company.name,
                    description: company.description
                  })}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Dashboard
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {companiesWithFinancials.length === 0 && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No companies yet</h3>
          <p className="text-gray-500 mb-4">Companies you create will appear here</p>
          <p className="text-sm text-muted-foreground">Use the organization switcher in the sidebar to create your first company</p>
        </div>
      )}
    </div>
  );
};

export default Companies;
