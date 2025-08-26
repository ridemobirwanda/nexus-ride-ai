import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminAuth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user has admin role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .single();

      if (roleError || !roleData || !["super_admin", "admin", "support"].includes(roleData.role)) {
        await supabase.auth.signOut();
        throw new Error("Access denied. Admin privileges required.");
      }

      // Log admin login activity
      await supabase.rpc('log_user_activity', {
        p_user_id: data.user.id,
        p_user_type: 'admin',
        p_activity_type: 'login',
        p_activity_details: { role: roleData.role, login_method: 'password' }
      });

      toast({
        title: "Login Successful",
        description: "Welcome to the admin panel!",
      });

      navigate("/admin");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For demo purposes - using our custom function
      if (email === "admin@admin.com") {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/admin/auth?reset=true`
        });

        if (error) throw error;

        toast({
          title: "Password Reset Sent",
          description: "Check your email for password reset instructions.",
        });
        setIsResetMode(false);
      } else {
        throw new Error("Admin user not found.");
      }
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen rider-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="gradient-card border-primary/20 card-shadow">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
              {isResetMode ? "Reset Password" : "Admin Panel"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {isResetMode 
                ? "Enter your email to receive password reset instructions"
                : "Sign in to access the administrative dashboard"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={isResetMode ? handlePasswordReset : handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@admin.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background/50 border-primary/20"
                />
              </div>
              {!isResetMode && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-background/50 border-primary/20"
                  />
                </div>
              )}
              <Button
                type="submit"
                className="w-full gradient-primary hover:scale-105 transition-smooth glow-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isResetMode ? "Sending..." : "Signing in..."}
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    {isResetMode ? "Send Reset Link" : "Sign In"}
                  </>
                )}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsResetMode(!isResetMode)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isResetMode ? "Back to Login" : "Forgot Password?"}
              </button>
            </div>

            {!isResetMode && (
              <div className="mt-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
                <div className="flex items-center gap-2 text-accent mb-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Demo Credentials</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>Email:</strong> admin@admin.com<br />
                  <strong>Password:</strong> admin123
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAuth;