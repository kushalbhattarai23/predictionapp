import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useAuth } from '@/hooks/useAuth';

interface AppSelectorProps {
  onAppSelect: (appId: string) => void;
}

const AppSelector: React.FC<AppSelectorProps> = ({ onAppSelect }) => {
  const { settings, isLoading } = useAppSettings();
  const { user } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen p-6">Loading...</div>;
  }

  const enabled = user ? settings.enabledApps.prediction : true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">TrackerHub</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">Prediction application</p>
        </div>

        {enabled ? (
          <div className="grid grid-cols-1 max-w-md mx-auto">
            <Card
              className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border-2 hover:border-gray-300 dark:hover:border-gray-600"
              onClick={() => onAppSelect('prediction')}
            >
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">Prediction</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">FIFA World Cup 2026 prediction league</CardDescription>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center mt-12">
            <p className="text-gray-600 dark:text-gray-300 text-lg">Prediction app is currently disabled for your account.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppSelector;
