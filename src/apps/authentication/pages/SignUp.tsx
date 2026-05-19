
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SignUpForm } from '../components/SignUpForm';
import { Link } from 'react-router-dom';

const SignUp = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>Join TrackerHub to start tracking your shows and managing your finances</CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUp;
