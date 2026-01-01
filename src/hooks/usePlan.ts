import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const PLAN_CACHE_KEY = "org_plan_cache";
const PATIENT_COUNT_CACHE_KEY = "patient_count_cache";
const FREEMIUM_PATIENT_LIMIT = 50;

interface PlanCache {
  plan: "freemium" | "premium";
  organizationId: string;
  timestamp: number;
}

interface PatientCountCache {
  count: number;
  organizationId: string;
  timestamp: number;
}

// Premium-only features
export const PREMIUM_FEATURES = [
  "analytics",
  "finance",
  "advanced_inventory",
  "multi_payment",
] as const;

export type PremiumFeature = (typeof PREMIUM_FEATURES)[number];

// Cache helpers
const getPlanFromCache = (): PlanCache | null => {
  try {
    const cached = localStorage.getItem(PLAN_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as PlanCache;
      // Cache valid for 1 hour
      if (Date.now() - parsed.timestamp < 3600000) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null;
};

const setPlanCache = (plan: "freemium" | "premium", organizationId: string) => {
  try {
    const cache: PlanCache = {
      plan,
      organizationId,
      timestamp: Date.now(),
    };
    localStorage.setItem(PLAN_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
};

const getPatientCountFromCache = (): PatientCountCache | null => {
  try {
    const cached = localStorage.getItem(PATIENT_COUNT_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as PatientCountCache;
      // Cache valid for 5 minutes
      if (Date.now() - parsed.timestamp < 300000) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null;
};

const setPatientCountCache = (count: number, organizationId: string) => {
  try {
    const cache: PatientCountCache = {
      count,
      organizationId,
      timestamp: Date.now(),
    };
    localStorage.setItem(PATIENT_COUNT_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
};

export function usePlan() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;
  const userRole = profile?.role;
  const isAdmin = userRole === "admin";

  // Fetch organization plan
  const { data: orgData, isLoading: isPlanLoading } = useQuery({
    queryKey: ["organization-plan", organizationId],
    queryFn: async () => {
      if (!organizationId) return null;

      const { data, error } = await supabase
        .from("organizations")
        .select("plan")
        .eq("id", organizationId)
        .single();

      if (error) {
        // Try cache on error
        const cached = getPlanFromCache();
        if (cached && cached.organizationId === organizationId) {
          return { plan: cached.plan };
        }
        throw error;
      }

      return data as { plan: "freemium" | "premium" };
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  // Fetch patient count
  const { data: patientCountData, isLoading: isCountLoading } = useQuery({
    queryKey: ["patient-count", organizationId],
    queryFn: async () => {
      if (!organizationId) return null;

      const { count, error } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId);

      if (error) {
        // Try cache on error
        const cached = getPatientCountFromCache();
        if (cached && cached.organizationId === organizationId) {
          return { count: cached.count };
        }
        throw error;
      }

      return { count: count || 0 };
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60, // 1 minute
    retry: 1,
  });

  const plan = orgData?.plan || "freemium";
  const patientCount = patientCountData?.count || 0;
  const isPremium = plan === "premium";
  const isFreemium = plan === "freemium";

  // Cache plan and count for offline use
  useEffect(() => {
    if (organizationId && orgData?.plan) {
      setPlanCache(orgData.plan, organizationId);
    }
  }, [organizationId, orgData?.plan]);

  useEffect(() => {
    if (organizationId && patientCountData?.count !== undefined) {
      setPatientCountCache(patientCountData.count, organizationId);
    }
  }, [organizationId, patientCountData?.count]);

  // Check if patient limit is reached
  const isPatientLimitReached = isFreemium && patientCount >= FREEMIUM_PATIENT_LIMIT;
  const remainingPatients = isFreemium 
    ? Math.max(0, FREEMIUM_PATIENT_LIMIT - patientCount) 
    : Infinity;

  // Check if a feature is available
  const hasFeatureAccess = (feature: PremiumFeature): boolean => {
    return isPremium;
  };

  // Check if user can add more patients
  const canAddPatient = (): boolean => {
    return isPremium || patientCount < FREEMIUM_PATIENT_LIMIT;
  };

  return {
    plan,
    isPremium,
    isFreemium,
    isAdmin,
    userRole,
    patientCount,
    patientLimit: FREEMIUM_PATIENT_LIMIT,
    isPatientLimitReached,
    remainingPatients,
    hasFeatureAccess,
    canAddPatient,
    isLoading: isPlanLoading || isCountLoading,
  };
}

// Utility to invalidate cache (call after upgrade)
export function invalidatePlanCache() {
  try {
    localStorage.removeItem(PLAN_CACHE_KEY);
    localStorage.removeItem(PATIENT_COUNT_CACHE_KEY);
  } catch {
    // Ignore errors
  }
}
