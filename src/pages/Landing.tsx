import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Activity, CreditCard, Cross } from "lucide-react";
import { Link } from "react-router-dom";
import { FeedbackModal } from "@/components/FeedbackModal";

const Landing = () => {
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary to-background flex flex-col">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cross className="h-8 w-8 text-primary" strokeWidth={2.5} />
            <span className="text-2xl font-bold text-foreground">MedCore</span>
          </div>
          {/* Hidden on mobile, visible on md and up */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/register">
              <Button>Register Hospital</Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline">Staff Login</Button>
            </Link>
          </div>
        </div>
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
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Cross className="h-6 w-6 text-primary" strokeWidth={2.5} />
                <span className="text-xl font-bold text-foreground">MedCore</span>
              </div>
              <p className="text-muted-foreground max-w-md">
                The modern operating system for hospitals. Streamline patient care, billing, and pharmacy management in one secure platform.
              </p>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => setFeedbackOpen(true)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Feedback
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm">
              &copy; 2025 MedCore. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link to="/" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link to="/" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Feedback Modal */}
      <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
};

export default Landing;
