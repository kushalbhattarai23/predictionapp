
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '../components/LoginForm';
import { Link } from 'react-router-dom';

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to your TrackerHub account</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
