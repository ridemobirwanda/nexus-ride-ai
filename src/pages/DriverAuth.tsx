import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Car, Mail, Lock, User, Phone, Eye, EyeOff, ArrowLeft, RotateCcw } from 'lucide-react';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import QRCodeSection from '@/components/QRCodeSection';

const DriverAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    carModel: '',
    carPlate: ''
  });

  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  const [resetEmail, setResetEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Auth state listener with driver role check
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Check if user is a driver
          setTimeout(async () => {
            try {
              const { data: isDriverUser, error } = await supabase.rpc('is_driver', {
                user_id: session.user.id
              });
              
              if (error) {
                console.error('Error checking driver status:', error);
                toast({
                  title: "Authentication Error",
                  description: "Unable to verify driver status. Please try again.",
                  variant: "destructive"
                });
                return;
              }
              
              if (isDriverUser) {
                navigate('/driver/dashboard');
              } else {
                toast({
                  title: "Access Denied",
                  description: "This portal is only for registered drivers. Please use the passenger app.",
                  variant: "destructive"
                });
                await supabase.auth.signOut();
              }
            } catch (error: any) {
              toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
              });
            }
          }, 500);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Check if user is a driver
        try {
          const { data: isDriverUser, error } = await supabase.rpc('is_driver', {
            user_id: session.user.id
          });
          
          if (error) {
            console.error('Error checking driver status:', error);
            return;
          }
          
          if (isDriverUser) {
            navigate('/driver/dashboard');
          } else {
            toast({
              title: "Access Denied", 
              description: "This portal is only for registered drivers.",
              variant: "destructive"
            });
            await supabase.auth.signOut();
          }
        } catch (error: any) {
          console.error('Session check error:', error);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (signUpData.password !== signUpData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    if (!signUpData.name || !signUpData.phone || !signUpData.carModel || !signUpData.carPlate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/driver/dashboard`;
      
      const { error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            user_type: 'driver',
            name: signUpData.name,
            phone: signUpData.phone,
            car_model: signUpData.carModel,
            car_plate: signUpData.carPlate
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Account Created!",
        description: "Your account is pending verification. Our team will review your application and notify you once approved. Please check your email to verify your account.",
      });
    } catch (error: any) {
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for a link to reset your password"
      });
      
      setShowForgotPassword(false);
      setResetEmail('');
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <Card className="gradient-card card-shadow">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Car className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">{t('driver.dashboard')}</CardTitle>
            <p className="text-muted-foreground text-center">
              {t('nav.driveWithUs')}
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">{t('auth.signIn')}</TabsTrigger>
                <TabsTrigger value="signup">{t('auth.signUp')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4 mt-4">
                {!showForgotPassword ? (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10"
                        value={signInData.email}
                        onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="pl-10 pr-10"
                        value={signInData.password}
                        onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                  
                  <div className="text-center mt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      Forgot your password?
                    </Button>
                  </div>
                </form>
                ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="text-center mb-4">
                    <RotateCcw className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="text-lg font-semibold">Reset Password</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter your email address and we'll send you a link to reset your password
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="Enter your email address"
                        className="pl-10"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading || !resetEmail}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {isLoading ? "Sending Reset Email..." : "Send Reset Email"}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail('');
                    }}
                    className="w-full text-sm text-muted-foreground"
                  >
                    Back to Sign In
                  </Button>
                </form>
                )}
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4 mt-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          placeholder="John Doe"
                          className="pl-10"
                          value={signUpData.name}
                          onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-phone">Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-phone"
                          placeholder="+1234567890"
                          className="pl-10"
                          value={signUpData.phone}
                          onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="john@example.com"
                        className="pl-10"
                        value={signUpData.email}
                        onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="car-model">Car Model</Label>
                      <div className="relative">
                        <Car className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="car-model"
                          placeholder="Toyota Prius"
                          className="pl-10"
                          value={signUpData.carModel}
                          onChange={(e) => setSignUpData({ ...signUpData, carModel: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="car-plate">License Plate</Label>
                      <Input
                        id="car-plate"
                        placeholder="ABC-123"
                        value={signUpData.carPlate}
                        onChange={(e) => setSignUpData({ ...signUpData, carPlate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create password"
                        className="pl-10 pr-10"
                        value={signUpData.password}
                        onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm password"
                        className="pl-10"
                        value={signUpData.confirmPassword}
                        onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating Account...' : 'Create Driver Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <QRCodeSection />
      </div>
    </div>
  );
};

export default DriverAuth;