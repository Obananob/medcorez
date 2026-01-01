import { AlertTriangle, Crown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface PlanBannerProps {
  type: "patient_limit_warning" | "patient_limit_reached" | "premium_feature";
  remainingPatients?: number;
  isAdmin: boolean;
  featureName?: string;
  onUpgradeClick?: () => void;
}

export function PlanBanner({
  type,
  remainingPatients,
  isAdmin,
  featureName,
  onUpgradeClick,
}: PlanBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const isWarning = type === "patient_limit_warning";
  const isReached = type === "patient_limit_reached";
  const isPremiumFeature = type === "premium_feature";

  const getBannerContent = () => {
    if (isWarning) {
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        message: `Only ${remainingPatients} patient slots remaining on free plan.`,
        action: isAdmin ? "Upgrade now" : null,
        className: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200",
      };
    }

    if (isReached) {
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        message: isAdmin
          ? "Patient limit reached. Upgrade to Premium to continue adding patients!"
          : "Patient limit reached. Contact Admin to upgrade.",
        action: isAdmin ? "Upgrade to Premium" : null,
        className: "bg-destructive/10 border-destructive/20 text-destructive dark:bg-destructive/20",
      };
    }

    if (isPremiumFeature) {
      return {
        icon: <Crown className="h-4 w-4" />,
        message: isAdmin
          ? `${featureName || "This feature"} is available in Premium Plan.`
          : `Premium feature — contact Admin to upgrade.`,
        action: isAdmin ? "Upgrade" : null,
        className: "bg-primary/10 border-primary/20 text-primary",
      };
    }

    return null;
  };

  const content = getBannerContent();
  if (!content) return null;

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 ${content.className}`}
    >
      <div className="flex items-center gap-2">
        {content.icon}
        <span className="text-sm font-medium">{content.message}</span>
      </div>
      <div className="flex items-center gap-2">
        {content.action && (
          <Button size="sm" variant="default" onClick={onUpgradeClick}>
            {content.action}
          </Button>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="rounded p-1 hover:bg-background/50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
