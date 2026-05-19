
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Loader2, Lock } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { isAdmin, isLoading: rolesLoading } = useUserRoles();

  React.useEffect(() => {
    if (user && isAdmin) {
      navigate('/admin');
    }
  }, [user, isAdmin, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const { error } = await signIn(email, password);
    if (error) setError(error.message);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Sign in as an admin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />Signing in...</> : <>Sign In as Admin</>}
            </Button>
          </form>
          <div className="text-center text-sm text-muted-foreground">
            <Link to="/admin/signup" className="text-blue-600 hover:underline">Admin Signup</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
