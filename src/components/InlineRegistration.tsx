import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { User, Phone, UserPlus } from 'lucide-react';

interface InlineRegistrationProps {
  onRegistrationComplete: (user: any) => void;
  title?: string;
  description?: string;
}

const InlineRegistration = ({ 
  onRegistrationComplete, 
  title = "Quick Registration", 
  description = "We just need a few details to complete your booking" 
}: InlineRegistrationProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Generate a simple email from phone number for anonymous users
      const tempEmail = `${formData.phone.replace(/\D/g, '')}@temp.ridenext.com`;
      const tempPassword = `temp_${Date.now()}`;
      
      // Sign up user with minimal data
      const { data, error } = await supabase.auth.signUp({
        email: tempEmail,
        password: tempPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            user_type: 'passenger',
            name: formData.name,
            phone: formData.phone,
            is_anonymous: true
          }
        }
      });

      if (error) throw error;

      // Create passenger profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('passengers')
          .insert({
            user_id: data.user.id,
            name: formData.name,
            phone: formData.phone
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Continue anyway, profile might exist
        }

        toast({
          title: "Registration Complete!",
          description: "You can now complete your booking."
        });

        onRegistrationComplete(data.user);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="gradient-card card-shadow">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full gradient-primary">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <p className="text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                className="pl-10"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                className="pl-10"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            variant="hero"
            disabled={isLoading || !formData.name || !formData.phone}
          >
            {isLoading ? "Creating Account..." : "Continue Booking"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default InlineRegistration;