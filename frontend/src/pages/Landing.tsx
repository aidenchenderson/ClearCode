import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, GitBranch, Users, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const values = [
  {
    icon: Eye,
    title: "See Every Commit",
    desc: "Full visibility into each student's contribution history.",
  },
  {
    icon: Users,
    title: "Track Group Contributions",
    desc: "Know who did what, when — no more guesswork.",
  },
  {
    icon: GitBranch,
    title: "GitHub-Native Workflow",
    desc: "Seamlessly integrates with how students already code.",
  },
];

const Landing = () => {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleGetStarted = async () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      setIsSigningIn(true);
      try {
        await login();
      } catch (err) {
        console.error("Login failed:", err);
        toast.error("Sign-in failed. Please try again.");
      } finally {
        setIsSigningIn(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col gradient-bg relative overflow-hidden">
      {/* Decorative floating elements */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-200/15 rounded-full blur-3xl animate-float"></div>
      <div className="absolute -bottom-20 -right-40 w-80 h-80 bg-purple-200/15 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }}></div>
      <div className="absolute top-1/3 right-1/3 w-72 h-72 bg-teal-200/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }}></div>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center relative z-10">
        <div className="animate-fade-in-up flex flex-col items-center gap-6">
          <img src="/ClearCodeLogo.png" alt="ClearCode" className="h-20 sm:h-24 w-auto" />
          <h1 className="max-w-3xl text-5xl sm:text-6xl font-bold tracking-tight text-foreground leading-tight">
            Transparency in <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Code-Based</span> Education
          </h1>
          <p className="mt-6 max-w-xl mx-auto text-lg text-muted-foreground leading-relaxed">
            A professor-first dashboard for managing assignments, classrooms, and
            student activity — powered by GitHub.
          </p>
        </div>
        <button
          onClick={handleGetStarted}
          className="mt-8 animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-lg transition-all duration-300 flex items-center gap-2">
            {isSigningIn ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing you in…
              </>
            ) : isAuthenticated ? (
              <>
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Sign In <ArrowRight className="h-4 w-4" />
              </>
            )}
          </div>
        </button>
      </section>

      {/* Value Props */}
      <section className="mx-auto grid w-full max-w-5xl gap-6 px-4 pb-16 sm:grid-cols-3 relative z-10 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        {values.map((v, i) => (
          <div key={v.title} style={{ animationDelay: `${0.3 + i * 0.1}s` }} className="animate-fade-in-up">
            <Card className="glass-card border-white/40 bg-white/50 backdrop-blur-xl soft-shadow card-hover h-full">
              <CardContent className="flex flex-col items-start gap-3 p-6">
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-100/60 to-purple-100/60">
                  <v.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-lg">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </CardContent>
            </Card>
          </div>
        ))}
      </section>

      {/* Demo placeholder */}
      <section className="mx-auto w-full max-w-4xl px-4 pb-20 relative z-10">
        <div className="flex h-64 items-center justify-center rounded-2xl border-2 border-white/30 backdrop-blur-md bg-white/20 soft-shadow">
          <p className="text-muted-foreground">
            Product demo video placeholder
          </p>
        </div>
      </section>
    </div>
  );
};

export default Landing;
