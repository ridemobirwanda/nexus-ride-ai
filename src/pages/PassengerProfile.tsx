import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Edit, 
  Save,
  LogOut,
  Camera
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface Passenger {
  id: string;
  name: string;
  phone: string;
  profile_pic?: string;
}

const PassengerProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [passenger, setPassenger] = useState<Passenger | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    profile_pic: ''
  });

  useEffect(() => {
    fetchUserAndProfile();
  }, []);

  const fetchUserAndProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/passenger/auth');
        return;
      }
      setUser(user);

      const { data: passengerData, error } = await supabase
        .from('passengers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      setPassenger(passengerData);
      setFormData({
        name: passengerData.name || '',
        phone: passengerData.phone || '',
        profile_pic: passengerData.profile_pic || ''
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!passenger) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('passengers')
        .update({
          name: formData.name,
          phone: formData.phone,
          profile_pic: formData.profile_pic || null
        })
        .eq('id', passenger.id);

      if (error) throw error;

      setPassenger({
        ...passenger,
        ...formData
      });
      
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    if (passenger) {
      setFormData({
        name: passenger.name || '',
        phone: passenger.phone || '',
        profile_pic: passenger.profile_pic || ''
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/passenger/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold">Profile</h1>
          </div>
          
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-md space-y-6">
        {/* Profile Picture */}
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="relative inline-block">
              <Avatar className="h-24 w-24 mx-auto">
                <AvatarImage src={formData.profile_pic} />
                <AvatarFallback className="text-2xl">
                  {formData.name.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {isEditing && (
              <div className="mt-4 space-y-2">
                <Label htmlFor="profile_pic">Profile Picture URL (optional)</Label>
                <Input
                  id="profile_pic"
                  placeholder="https://example.com/image.jpg"
                  value={formData.profile_pic}
                  onChange={(e) => setFormData({ ...formData, profile_pic: e.target.value })}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                />
              ) : (
                <div className="p-3 bg-muted/30 rounded-md">
                  {passenger?.name || 'Not set'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter your phone number"
                />
              ) : (
                <div className="p-3 bg-muted/30 rounded-md">
                  {passenger?.phone || 'Not set'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="p-3 bg-muted/30 rounded-md text-muted-foreground">
                {user?.email}
                <span className="text-xs ml-2">(Cannot be changed)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/passenger/history')}
            >
              View Ride History
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              <p>Member since {new Date(user?.created_at || '').toLocaleDateString()}</p>
              <p className="mt-1">User ID: {passenger?.id}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PassengerProfile;