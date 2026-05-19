import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Lock, Save, Camera, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfileAvatar } from '@/hooks/useProfileAvatar';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAvatar, uploading, getAvatarUrl } = useProfileAvatar();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile(data);
        setFormData(prev => ({
          ...prev,
          firstName: data.first_name || '',
          lastName: data.last_name || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be smaller than 2MB');
      return;
    }
    await uploadAvatar(file);
    fetchProfile();
  };

  const handleRemoveAvatar = async () => {
    if (!user?.id || !profile?.avatar_url) return;
    try {
      await supabase.storage.from('avatars').remove([profile.avatar_url]);
      await supabase.from('profiles').update({ avatar_url: null, updated_at: new Date().toISOString() }).eq('id', user.id);
      toast.success('Profile picture removed');
      fetchProfile();
    } catch (error) {
      console.error('Remove avatar error:', error);
      toast.error('Failed to remove profile picture');
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user?.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      toast.success('Profile updated successfully');
      fetchProfile();
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: formData.newPassword });
      if (error) throw error;
      toast.success('Password updated successfully');
      setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
    } catch (error) {
      console.error('Password update error:', error);
      toast.error('Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const avatarUrl = getAvatarUrl(profile?.avatar_url);
  const displayName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : profile?.first_name || profile?.last_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">Welcome, {displayName}!</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Profile Picture
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Avatar className="h-24 w-24">
                {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile" />}
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {(user?.email?.charAt(0) || 'U').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Camera className="h-4 w-4 mr-1" />
                {uploading ? 'Uploading...' : avatarUrl ? 'Change Picture' : 'Add Picture'}
              </Button>
              {avatarUrl && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  disabled={uploading}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Max 2MB. JPG, PNG or GIF.</p>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={formData.firstName} onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))} placeholder="First name" />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={formData.lastName} onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))} placeholder="Last name" />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                <Save className="h-4 w-4 mr-2" />
                Update Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Update */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" value={formData.newPassword} onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))} placeholder="New password" />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))} placeholder="Confirm password" />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                <Lock className="h-4 w-4 mr-2" />
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
