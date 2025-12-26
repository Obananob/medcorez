import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Activity, CreditCard, Cross, Menu, X, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { FeedbackModal } from "@/components/FeedbackModal";
import { supabase } from "@/integrations/supabase/client";

const Landing = () => {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();

  // Check for existing session and redirect authenticated users to dashboard
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // User is authenticated, redirect to dashboard
          navigate("/dashboard", { replace: true });
          return;
        }
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkSession();

    // Also listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate("/dashboard", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-secondary to-background">
        <div className="flex flex-col items-center gap-4">
          <Cross className="h-12 w-12 text-primary animate-pulse" strokeWidth={2.5} />
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary to-background flex flex-col">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cross className="h-8 w-8 text-primary" strokeWidth={2.5} />
            <span className="text-2xl font-bold text-foreground">MedCore</span>
          </div>
          
          {/* Desktop Nav - Hidden on mobile, visible on md and up */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/register">
              <Button>Register Hospital</Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline">Staff Login</Button>
            </Link>
          </div>

          {/* Mobile Menu Button - Visible on mobile only */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-b border-border">
            <div className="flex flex-col gap-3">
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full">Register Hospital</Button>
              </Link>
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">Staff Login</Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20 flex-1">
        <div className="text-center max-w-4xl mx-auto mb-20">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            The Modern Operating System for Hospitals
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Streamline patient care, billing, and pharmacy in one secure platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Register Hospital
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Staff Login
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-card rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-secondary rounded-lg w-12 h-12 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Multi-Tenant Security
            </h3>
            <p className="text-muted-foreground">
              Enterprise-grade isolation ensures each hospital's data remains completely secure and private
            </p>
          </div>

          <div className="bg-card rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-secondary rounded-lg w-12 h-12 flex items-center justify-center mb-4">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Real-time Triage
            </h3>
            <p className="text-muted-foreground">
              AI-powered patient prioritization and instant updates across departments
            </p>
          </div>

          <div className="bg-card rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-secondary rounded-lg w-12 h-12 flex items-center justify-center mb-4">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Integrated Billing
            </h3>
            <p className="text-muted-foreground">
              Seamless insurance claims processing and payment management in one place
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Cross className="h-5 w-5 text-primary" strokeWidth={2.5} />
              <span className="text-lg font-bold text-foreground">MedCore</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <button
                onClick={() => setFeedbackOpen(true)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Feedback
              </button>
            </div>
            
            <p className="text-muted-foreground text-sm">
              &copy; 2025 MedCore. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Feedback Modal */}
      <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
};

export default Landing;
