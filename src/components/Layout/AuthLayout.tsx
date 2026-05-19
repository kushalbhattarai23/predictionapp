
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Tv, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
      {/* Navigation Header */}
      <header className="bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center hover:bg-purple-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">ModularApp</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex space-x-2">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Tv className="h-6 w-6 text-white" />
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {title}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {subtitle}
            </p>
          </div>
          
          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-white/20 p-8">
            {children}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/90 backdrop-blur border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xs">M</span>
              </div>
              <span className="text-sm text-gray-600">© 2024 ModularApp. All rights reserved.</span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-500">
              <a href="#" className="hover:text-purple-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-purple-600 transition-colors">Terms</a>
              <a href="#" className="hover:text-purple-600 transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;
