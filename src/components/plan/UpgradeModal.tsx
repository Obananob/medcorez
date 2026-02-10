import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crown, Sparkles, Users, BarChart3, Wallet, Package, CreditCard, Tag, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { invalidatePlanCache } from "@/hooks/usePlan";
import { toast } from "sonner";

const PROMO_CODE = "OBANANOB91";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: "patient_limit" | "premium_feature";
  featureName?: string;
}

export function UpgradeModal({ open, onOpenChange, reason, featureName }: UpgradeModalProps) {
  const isPatientLimit = reason === "patient_limit";
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<"main" | "promo" | "stripe">("main");
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgraded, setUpgraded] = useState(false);

  const upgradeToPremium = async () => {
    if (!profile?.organization_id) return;
    setIsUpgrading(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ plan: "premium" })
        .eq("id", profile.organization_id);

      if (error) throw error;

      invalidatePlanCache();
      queryClient.invalidateQueries({ queryKey: ["organization-plan"] });
      queryClient.invalidateQueries({ queryKey: ["patient-count"] });
      setUpgraded(true);
      toast.success("🎉 Upgraded to Premium! All features unlocked.");
    } catch (err: any) {
      toast.error("Upgrade failed: " + err.message);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handlePromoSubmit = () => {
    if (promoCode.trim().toUpperCase() === PROMO_CODE) {
      setPromoError("");
      upgradeToPremium();
    } else {
      setPromoError("Invalid promo code");
    }
  };

  const handleSimulatedPayment = () => {
    upgradeToPremium();
  };

  const handleClose = (value: boolean) => {
    if (!value) {
      // Reset state on close
      setTab("main");
      setPromoCode("");
      setPromoError("");
      setUpgraded(false);
    }
    onOpenChange(value);
  };

  if (upgraded) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-6 gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600">
              <Check className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Welcome to Premium!</h2>
            <p className="text-center text-sm text-muted-foreground">
              All features are now unlocked. Enjoy unlimited patients, analytics, finance management, and more.
            </p>
            <Button className="w-full" onClick={() => handleClose(false)}>
              Get Started
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-center text-xl">
            {isPatientLimit ? "Patient Limit Reached" : "Premium Feature"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isPatientLimit
              ? "You have reached your 50 patient limit on the free plan."
              : `${featureName || "This feature"} is available in the Premium plan.`}
          </DialogDescription>
        </DialogHeader>

        {tab === "main" && (
          <>
            <div className="mt-4 space-y-3">
              <p className="text-center text-sm text-muted-foreground">
                Upgrade to Premium to unlock:
              </p>
              <div className="grid gap-2">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-sm">Unlimited patient records</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span className="text-sm">Analytics dashboard</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Wallet className="h-5 w-5 text-primary" />
                  <span className="text-sm">Finance & billing management</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Package className="h-5 w-5 text-primary" />
                  <span className="text-sm">Advanced inventory tracking</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <Button className="w-full gap-2" onClick={() => setTab("stripe")}>
                <CreditCard className="h-4 w-4" />
                Pay & Upgrade
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={() => setTab("promo")}>
                <Tag className="h-4 w-4" />
                I have a promo code
              </Button>
              <Button variant="ghost" onClick={() => handleClose(false)}>
                Maybe later
              </Button>
            </div>
          </>
        )}

        {tab === "promo" && (
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Enter Promo Code</label>
              <Input
                placeholder="e.g. PROMO2024"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value);
                  setPromoError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handlePromoSubmit()}
              />
              {promoError && (
                <p className="text-sm text-destructive">{promoError}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                className="w-full gap-2"
                onClick={handlePromoSubmit}
                disabled={!promoCode.trim() || isUpgrading}
              >
                {isUpgrading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Activating...</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Apply Code</>
                )}
              </Button>
              <Button variant="ghost" onClick={() => setTab("main")}>
                Back
              </Button>
            </div>
          </div>
        )}

        {tab === "stripe" && (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">MedCore Premium</span>
                <span className="font-bold text-foreground">$49/mo</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Unlimited patients, analytics, finance, inventory, and more.
              </p>
              <div className="border-t pt-3 space-y-2">
                <Input placeholder="Card number (simulated)" disabled value="4242 4242 4242 4242" />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="MM/YY" disabled value="12/28" />
                  <Input placeholder="CVC" disabled value="123" />
                </div>
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              This is a simulated payment — no real charge will be made.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                className="w-full gap-2"
                onClick={handleSimulatedPayment}
                disabled={isUpgrading}
              >
                {isUpgrading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  <><CreditCard className="h-4 w-4" /> Confirm Payment</>
                )}
              </Button>
              <Button variant="ghost" onClick={() => setTab("main")}>
                Back
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
