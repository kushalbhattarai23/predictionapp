
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
// Removed Alert import
// import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

export default function AdminSignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Remove error state - we will display errors using toast
  // const [error, setError] = useState<string | null>(null);
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  React.useEffect(() => {
    if (user) navigate('/admin');
  }, [user, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // setError(null);
    const { user: newUser, error } = await signUp(email, password);

    if (error) {
      // Show specific toast for already registered error
      const msg = error.message?.toLowerCase() || "";
      if (
        msg.includes("already registered") ||
        msg.includes("user already exists") ||
        msg.includes("already exists")
      ) {
        toast({
          title: "Error",
          description: "Email already registered.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
      setIsLoading(false);
      return;
    }
    // Assign admin role
    if (newUser) {
      await supabase.from('user_roles').insert({
        user_id: newUser.id,
        role: 'admin'
      });
    }
    setIsLoading(false);
    navigate('/admin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Signup</CardTitle>
          <CardDescription>Create a new admin account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Removed inline Alert.
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>} */}
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />Signing up...</> : <>Sign Up as Admin</>}
            </Button>
          </form>
          <div className="text-center text-sm text-muted-foreground">
            <Link to="/admin/login" className="text-blue-600 hover:underline">Back to Admin Login</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
