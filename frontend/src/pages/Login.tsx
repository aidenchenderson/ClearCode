import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GraduationCap, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogin = async () => {
    setIsSigningIn(true);
    try {
      await login();
    } catch (err) {
      console.error("Login failed:", err);
      toast.error("Sign-in failed. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center gradient-bg">
        <div className="text-center">
          <div className="inline-flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary soft-glow-icon" />
          </div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col gradient-bg relative overflow-hidden">
      {/* Decorative floating elements */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }}></div>
      <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-teal-200/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>

      {/* Content */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center relative z-10">
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100/60 to-purple-100/60 backdrop-blur-md">
              <GraduationCap className="h-7 w-7 text-primary" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              EduTransparency
            </span>
          </div>
        </div>

        <div className="max-w-2xl animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Transparency in <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Code-Based</span> Education
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Sign in to access your classroom dashboards and track student
            contributions — powered by GitHub.
          </p>
        </div>

        <div className="mt-12 w-full max-w-md animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <Card className="glass-card border-white/40 bg-white/50 backdrop-blur-xl soft-shadow-lg">
            <CardHeader className="space-y-2 pb-4">
              <CardTitle className="text-lg">Welcome back</CardTitle>
              <CardDescription className="text-sm">
                Continue with your account to access the dashboard
              </CardDescription>
            </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleLogin}
              size="lg"
              className="w-full gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-lg transition-all duration-300"
              disabled={isSigningIn}
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing you in…
                </>
              ) : (
                <>
                  Sign in with Google
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardContent>
        </Card>
        </div>

        {/* Trust badges */}
        <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 text-xs text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Secure OAuth</span>
          </div>
          <div className="hidden sm:block w-1 h-1 bg-muted rounded-full"></div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>GitHub Verified</span>
          </div>
          <div className="hidden sm:block w-1 h-1 bg-muted rounded-full"></div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Data Encrypted</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;
