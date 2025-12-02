import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Organization {
  id: string;
  name: string;
  currency_symbol: string;
  address: string | null;
  contact_phone: string | null;
  support_email: string | null;
  timezone: string;
}

export function useOrganization() {
  const { profile } = useAuth();

  const { data: organization, isLoading, refetch } = useQuery({
    queryKey: ["organization", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return null;
      
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", profile.organization_id)
        .single();

      if (error) throw error;
      return data as Organization;
    },
    enabled: !!profile?.organization_id,
  });

  const currencySymbol = organization?.currency_symbol || "$";

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return `${currencySymbol}0.00`;
    return `${currencySymbol}${amount.toFixed(2)}`;
  };

  return {
    organization,
    isLoading,
    currencySymbol,
    formatCurrency,
    refetch,
  };
}
