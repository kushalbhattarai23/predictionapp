
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NetworkForm } from '../components/NetworkForm';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const CreateNetworkPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/settlebill/networks');
  };

  const handleClose = () => {
    navigate('/settlebill/networks');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/settlebill/networks">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Networks
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-red-700">Create New Network</h1>
        </div>
        
        <Card className="shadow-lg border border-orange-200 dark:border-orange-800">
          <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-t-lg">
            <CardTitle className="text-xl">Network Details</CardTitle>
            <p className="text-red-100">Create a new network to start splitting bills with your group</p>
          </CardHeader>
          <CardContent className="p-6">
            <NetworkForm 
              onClose={handleClose}
              onSuccess={handleSuccess}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
