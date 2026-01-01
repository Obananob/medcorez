import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Users, BarChart3, Wallet, Package } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: "patient_limit" | "premium_feature";
  featureName?: string;
}

export function UpgradeModal({ open, onOpenChange, reason, featureName }: UpgradeModalProps) {
  const isPatientLimit = reason === "patient_limit";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button className="w-full gap-2">
            <Sparkles className="h-4 w-4" />
            Upgrade to Premium
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
