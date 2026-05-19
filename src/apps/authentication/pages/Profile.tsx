
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Mail } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: '',
    lastName: '',
  });

  const getInitials = (email: string) => {
    return email?.charAt(0)?.toUpperCase() || 'U';
  };

  const handleSave = () => {
    // TODO: Implement profile update functionality
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials(user?.email || '')}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="flex items-center justify-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>View and update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter your first name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter your last name"
              />
            </div>

            <div className="flex gap-2 pt-4">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} className="flex-1">
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} className="w-full">
                  Edit Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
