import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Syringe, Shield, Calendar } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface ImmunizationData {
  tt1_date?: string | null;
  tt2_date?: string | null;
  tt3_date?: string | null;
  tt4_date?: string | null;
  tt5_date?: string | null;
  iptp1_date?: string | null;
  iptp2_date?: string | null;
  iptp3_date?: string | null;
}

interface ANCImmunizationCardProps {
  enrollmentId: string;
  immunizations: ImmunizationData;
}

export function ANCImmunizationCard({ enrollmentId, immunizations }: ANCImmunizationCardProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const updateImmunization = useMutation({
    mutationFn: async ({ field, checked }: { field: string; checked: boolean }) => {
      const dateField = field;
      const staffField = field.replace('_date', '_staff_id');
      
      const updateData: Record<string, string | null> = {
        [dateField]: checked ? new Date().toISOString().split('T')[0] : null,
        [staffField]: checked ? user?.id || null : null,
      };

      const { error } = await supabase
        .from("anc_enrollments")
        .update(updateData)
        .eq("id", enrollmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anc-enrollment"] });
      toast.success("Immunization record updated");
    },
    onError: () => {
      toast.error("Failed to update immunization");
    },
  });

  const ttDoses = [
    { key: "tt1_date", label: "TT1", date: immunizations.tt1_date },
    { key: "tt2_date", label: "TT2", date: immunizations.tt2_date },
    { key: "tt3_date", label: "TT3", date: immunizations.tt3_date },
    { key: "tt4_date", label: "TT4", date: immunizations.tt4_date },
    { key: "tt5_date", label: "TT5", date: immunizations.tt5_date },
  ];

  const iptpDoses = [
    { key: "iptp1_date", label: "IPTp 1", date: immunizations.iptp1_date },
    { key: "iptp2_date", label: "IPTp 2", date: immunizations.iptp2_date },
    { key: "iptp3_date", label: "IPTp 3", date: immunizations.iptp3_date },
  ];

  const handleToggle = (field: string, checked: boolean) => {
    updateImmunization.mutate({ field, checked });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Syringe className="h-5 w-5 text-green-600" />
          Preventive Care Checklist
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tetanus Toxoid Doses */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-blue-500" />
            <h4 className="font-medium text-sm">Tetanus Toxoid (TT)</h4>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {ttDoses.map((dose) => (
              <div 
                key={dose.key}
                className={`p-3 rounded-lg border text-center transition-colors ${
                  dose.date 
                    ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" 
                    : "bg-muted/30 border-border"
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Checkbox
                    id={dose.key}
                    checked={!!dose.date}
                    onCheckedChange={(checked) => handleToggle(dose.key, !!checked)}
                    disabled={updateImmunization.isPending}
                  />
                  <Label htmlFor={dose.key} className="text-sm font-medium cursor-pointer">
                    {dose.label}
                  </Label>
                </div>
                {dose.date && (
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(dose.date), "dd/MM/yy")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* IPTp (Malaria Prevention) Doses */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-purple-500" />
            <h4 className="font-medium text-sm">IPTp (Malaria Prevention)</h4>
            <Badge variant="outline" className="text-xs">SP/Fansidar</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {iptpDoses.map((dose) => (
              <div 
                key={dose.key}
                className={`p-3 rounded-lg border text-center transition-colors ${
                  dose.date 
                    ? "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800" 
                    : "bg-muted/30 border-border"
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Checkbox
                    id={dose.key}
                    checked={!!dose.date}
                    onCheckedChange={(checked) => handleToggle(dose.key, !!checked)}
                    disabled={updateImmunization.isPending}
                  />
                  <Label htmlFor={dose.key} className="text-sm font-medium cursor-pointer">
                    {dose.label}
                  </Label>
                </div>
                {dose.date && (
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(dose.date), "dd/MM/yy")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}