import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { differenceInYears } from "date-fns";

interface RiskFactors {
  patientDob?: string | null;
  gravida: number;
  visits?: Array<{
    blood_pressure_systolic: number | null;
    blood_pressure_diastolic: number | null;
  }>;
}

export function calculateHighRiskFactors(factors: RiskFactors): string[] {
  const risks: string[] = [];

  // Age-based risk
  if (factors.patientDob) {
    const age = differenceInYears(new Date(), new Date(factors.patientDob));
    if (age > 35) {
      risks.push("Advanced Maternal Age (>35)");
    } else if (age < 18) {
      risks.push("Adolescent Pregnancy (<18)");
    }
  }

  // Grand Multipara
  if (factors.gravida > 5) {
    risks.push("Grand Multipara (G>5)");
  }

  // Check for consistent high BP (2 or more visits with high BP)
  if (factors.visits && factors.visits.length >= 2) {
    const highBPCount = factors.visits.filter(v => 
      v.blood_pressure_systolic && v.blood_pressure_diastolic &&
      (v.blood_pressure_systolic > 140 || v.blood_pressure_diastolic > 90)
    ).length;

    if (highBPCount >= 2) {
      risks.push("Chronic Hypertension");
    }
  }

  return risks;
}

interface ANCRiskBadgeProps {
  riskFactors: string[];
  showDetails?: boolean;
}

export function ANCRiskBadge({ riskFactors, showDetails = false }: ANCRiskBadgeProps) {
  if (riskFactors.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="destructive" className="gap-1 animate-pulse">
        <AlertTriangle className="h-3 w-3" />
        High Risk ANC
      </Badge>
      {showDetails && riskFactors.map((risk, index) => (
        <Badge key={index} variant="outline" className="text-xs border-destructive/50 text-destructive">
          {risk}
        </Badge>
      ))}
    </div>
  );
}