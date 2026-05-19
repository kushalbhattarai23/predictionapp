
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LogIn, Mail, Tv, DollarSign, UserPlus, ArrowLeft, Film, Receipt, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

export const SignUpForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { user, error } = await signUp(email, password);
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else if (user) {
        toast({
          title: "Account created!",
          description: "Please check your email to confirm your account.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Sign up failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Google sign up failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
      {/* Left Sidebar */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-blue-600 to-green-600 p-12 flex-col justify-between text-white">
        <div>
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
              <span className="text-xl font-bold">T</span>
            </div>
            <span className="text-2xl font-bold">TrackerHub</span>
          </div>
          
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-4">Join TrackerHub</h1>
              <p className="text-xl text-white/90 leading-relaxed">
                Your all-in-one platform for tracking TV shows, managing finances, organizing movies, and splitting bills with friends.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="flex items-start space-x-4 p-4 bg-white/10 rounded-xl backdrop-blur">
                <div className="w-12 h-12 bg-purple-500/30 rounded-lg flex items-center justify-center">
                  <Tv className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">TV Show Tracker</h3>
                  <p className="text-white/80">Organize episodes, create universes, and discover new shows</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-white/10 rounded-xl backdrop-blur">
                <div className="w-12 h-12 bg-green-500/30 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Finance Manager</h3>
                  <p className="text-white/80">Track expenses, manage budgets, and achieve financial goals</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-white/10 rounded-xl backdrop-blur">
                <div className="w-12 h-12 bg-blue-500/30 rounded-lg flex items-center justify-center">
                  <Film className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Movie Tracker</h3>
                  <p className="text-white/80">Track your watchlist, rate movies, and discover new films</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-white/10 rounded-xl backdrop-blur">
                <div className="w-12 h-12 bg-orange-500/30 rounded-lg flex items-center justify-center">
                  <Receipt className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Bill Splitting</h3>
                  <p className="text-white/80">Split expenses with friends using SettleGara and SettleBill</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-12">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur">
            <CardHeader className="space-y-1 text-center">
              <div className="lg:hidden flex items-center justify-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">T</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">TrackerHub</span>
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Create your account
              </CardTitle>
              <CardDescription className="text-base">
                Sign up to get started with TrackerHub
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full border-2 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-200"
                onClick={handleGoogleSignUp}
                disabled={isLoading}
              >
                <Mail className="mr-2 h-4 w-4" />
                Sign up with Google
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">
                    Or sign up with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-2 focus:border-purple-500 transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-2 focus:border-purple-500 transition-colors"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-2 focus:border-purple-500 transition-colors"
                    required
                    minLength={6}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 transition-all duration-200" 
                  disabled={isLoading}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {isLoading ? 'Creating account...' : 'Create account'}
                </Button>
              </form>

              <div className="text-center text-sm text-muted-foreground">
                <p>
                  Already have an account?{' '}
                  <Link to="/login" className="text-purple-600 hover:text-purple-700 font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default SignUpForm;
