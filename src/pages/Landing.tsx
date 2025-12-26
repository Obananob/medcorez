import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Activity, 
  Clock, 
  Cross, 
  Menu, 
  X, 
  Loader2,
  Users,
  FileText,
  Package,
  Wallet,
  Lock,
  Cloud,
  UserCheck,
  ArrowRight,
  CheckCircle2,
  Play,
  Building2,
  Stethoscope,
  HeartPulse
} from "lucide-react";
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate("/dashboard", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-white to-secondary">
        <div className="flex flex-col items-center gap-4">
          <Cross className="h-12 w-12 text-primary animate-pulse" strokeWidth={2.5} />
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: Activity,
      title: "Smart Triage",
      description: "Speed up patient flow with digital vitals and automated queuing. No more chaotic waiting rooms.",
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      icon: FileText,
      title: "Secure EMR",
      description: "Access patient history in 3 seconds. No more missing paper folders or illegible handwriting.",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Package,
      title: "Inventory & Pharmacy",
      description: "Track every tablet. Get alerted before drugs expire. Prevent stock-outs and losses.",
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      icon: Wallet,
      title: "Financial Oversight",
      description: "Real-time billing and payment tracking to ensure every Naira is accounted for.",
      color: "text-warning",
      bg: "bg-warning/10",
    },
  ];

  const securityFeatures = [
    {
      icon: Lock,
      title: "Data Isolation",
      description: "Your data is yours. Every hospital is isolated with military-grade encryption. Hospital A cannot see Hospital B's data.",
    },
    {
      icon: Cloud,
      title: "Cloud Reliability",
      description: "Powered by enterprise infrastructure for 99.9% uptime and automatic daily backups. Your data is never lost.",
    },
    {
      icon: UserCheck,
      title: "Role-Based Access",
      description: "Only authorized staff see sensitive patient data. Nurses, doctors, and admins have different permission levels.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Register",
      description: "Sign up your hospital in 60 seconds. No credit card required.",
      icon: Building2,
    },
    {
      number: "02",
      title: "Onboard Staff",
      description: "Add your doctors and nurses with one click. Auto-generated login credentials.",
      icon: Users,
    },
    {
      number: "03",
      title: "Go Live",
      description: "Start managing patients and generating digital prescriptions immediately.",
      icon: HeartPulse,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-2 rounded-lg">
                <Cross className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-bold text-foreground">MedCore</span>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" className="text-muted-foreground hover:text-primary">
                  Staff Login
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Register Hospital
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-muted-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-border pt-4">
              <div className="flex flex-col gap-3">
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Staff Login</Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    Register Hospital
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-secondary via-white to-secondary py-16 md:py-24">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxNDlhOWEiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-secondary text-primary hover:bg-secondary border-primary/20 px-4 py-1.5">
              <Stethoscope className="h-3.5 w-3.5 mr-1.5" />
              Built for Nigerian Healthcare
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight tracking-tight">
              Digitize Your Clinic Operations.{" "}
              <span className="text-primary">Protect Your Revenue.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              The all-in-one hospital management system built for Nigerian healthcare. 
              Manage patients, track vitals, and stop revenue leakage in one secure platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 text-base px-8 py-6">
                  Register Your Hospital
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto border-border text-muted-foreground hover:bg-muted text-base px-8 py-6"
                onClick={() => setFeedbackOpen(true)}
              >
                <Play className="mr-2 h-5 w-5" />
                Watch 2-Minute Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Power Stats Bar */}
      <section className="bg-primary py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex items-center justify-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-primary-foreground/70" />
              <span className="text-primary-foreground font-medium text-lg">Zero Data Loss Guarantee</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Shield className="h-6 w-6 text-primary-foreground/70" />
              <span className="text-primary-foreground font-medium text-lg">100% Secure Patient Records</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Clock className="h-6 w-6 text-primary-foreground/70" />
              <span className="text-primary-foreground font-medium text-lg">24/7 Access from Any Device</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <Badge className="mb-4 bg-muted text-muted-foreground hover:bg-muted">
              Clinician-First Design
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything Your Hospital Needs
            </h2>
            <p className="text-lg text-muted-foreground">
              Built by healthcare professionals who understand the chaos of a Nigerian clinic. 
              No more missing files, lost payments, or expired drugs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className={`${feature.bg} ${feature.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <Badge className="mb-4 bg-secondary text-primary hover:bg-secondary">
              Get Started in Minutes
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Go from signup to seeing your first patient in under 5 minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-card rounded-2xl p-8 border border-border hover:border-primary/30 hover:shadow-lg transition-all text-center">
                  <div className="text-5xl font-bold text-primary/20 mb-4">{step.number}</div>
                  <div className="bg-primary w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="h-8 w-8 text-border" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4 bg-secondary text-primary hover:bg-secondary">
                  Our Story
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Built by a Medical Student Who Understood the Problem
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    MedCore was born in a small Nigerian private clinic where chaos was the norm. 
                    Paper folders disappeared. Patients waited hours. Revenue leaked through the cracks.
                  </p>
                  <p>
                    As a medical student observing this daily, I asked: <em>"Why can't clinics have 
                    the same technology that powers banks and fintech?"</em>
                  </p>
                  <p>
                    So I built MedCore — a modern operating system specifically designed for the 
                    Nigerian healthcare environment. No foreign templates. No assumptions that 
                    don't work here. Just practical tools that solve real problems.
                  </p>
                  <p className="font-medium text-foreground">
                    Our mission is simple: Digitize every Nigerian clinic and protect every Naira 
                    of revenue, one hospital at a time.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-secondary to-secondary/50 rounded-3xl p-8 border border-primary/20">
                  <div className="bg-card rounded-2xl shadow-xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary p-3 rounded-full">
                        <Stethoscope className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Founded in Nigeria</p>
                        <p className="text-sm text-muted-foreground">For Nigerian Healthcare</p>
                      </div>
                    </div>
                    <Separator className="bg-border" />
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-primary">100%</p>
                        <p className="text-sm text-muted-foreground">Local Focus</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-primary">24/7</p>
                        <p className="text-sm text-muted-foreground">Support</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <Badge className="mb-4 bg-white/10 text-white border-white/20 hover:bg-white/20">
              <Shield className="h-3.5 w-3.5 mr-1.5" />
              Enterprise-Grade Security
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Your Patient Data is Sacred
            </h2>
            <p className="text-lg text-gray-400">
              We take data privacy seriously. Every hospital is completely isolated with 
              Row-Level Security (RLS) ensuring your data never mixes with another clinic.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-primary/50 transition-all">
                <div className="bg-primary w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/register">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Transform Your Clinic?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join hundreds of Nigerian healthcare providers who trust MedCore to manage their operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-gray-100 shadow-lg">
                Register Your Hospital
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10">
                Staff Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-2 rounded-lg">
                <Cross className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold text-white">MedCore</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <Link to="/" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <button
                onClick={() => setFeedbackOpen(true)}
                className="hover:text-white transition-colors"
              >
                Send Feedback
              </button>
            </div>
            
            <p className="text-sm">
              &copy; 2025 MedCore. Built for Nigerian Healthcare.
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
