import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Activity, Heart, AlertCircle } from "lucide-react";
import { useOrganization } from "@/hooks/useOrganization";
import {
  fetalPresentationOptions,
  getFetalHeartRateStatus,
  getFundalHeightStatus,
} from "@/utils/ancUtils";
import { getBPStatus } from "@/utils/cdssUtils";

interface ANCVisitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enrollmentId: string;
  patientId: string;
  gestationalWeeks: number;
  gestationalDays: number;
}

export function ANCVisitModal({
  open,
  onOpenChange,
  enrollmentId,
  patientId,
  gestationalWeeks,
  gestationalDays,
}: ANCVisitModalProps) {
  const queryClient = useQueryClient();
  const { organization } = useOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fundal_height: "",
    fetal_heart_rate: "",
    fetal_presentation: "",
    edema: false,
    weight_kg: "",
    bp_systolic: "",
    bp_diastolic: "",
    urine_protein: "",
    urine_glucose: "",
    notes: "",
  });

  // Calculate clinical alerts
  const fhrValue = parseInt(formData.fetal_heart_rate);
  const fhrStatus = fhrValue ? getFetalHeartRateStatus(fhrValue) : null;
  
  const fundalValue = parseFloat(formData.fundal_height);
  const fundalStatus = fundalValue ? getFundalHeightStatus(fundalValue, gestationalWeeks) : null;

  const bpSystolic = parseInt(formData.bp_systolic);
  const bpDiastolic = parseInt(formData.bp_diastolic);
  const bpStatus = bpSystolic && bpDiastolic ? getBPStatus(bpSystolic, bpDiastolic) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization?.id) {
      toast.error("Organization not found");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("anc_visits").insert({
        organization_id: organization.id,
        enrollment_id: enrollmentId,
        patient_id: patientId,
        gestational_age_weeks: gestationalWeeks,
        gestational_age_days: gestationalDays,
        fundal_height_cm: formData.fundal_height ? parseFloat(formData.fundal_height) : null,
        fetal_heart_rate: formData.fetal_heart_rate ? parseInt(formData.fetal_heart_rate) : null,
        fetal_presentation: formData.fetal_presentation || null,
        edema: formData.edema,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        blood_pressure_systolic: formData.bp_systolic ? parseInt(formData.bp_systolic) : null,
        blood_pressure_diastolic: formData.bp_diastolic ? parseInt(formData.bp_diastolic) : null,
        urine_protein: formData.urine_protein || null,
        urine_glucose: formData.urine_glucose || null,
        notes: formData.notes || null,
      });

      if (error) throw error;

      toast.success("ANC visit recorded successfully");
      queryClient.invalidateQueries({ queryKey: ["anc-visits", enrollmentId] });
      onOpenChange(false);
      setFormData({
        fundal_height: "",
        fetal_heart_rate: "",
        fetal_presentation: "",
        edema: false,
        weight_kg: "",
        bp_systolic: "",
        bp_diastolic: "",
        urine_protein: "",
        urine_glucose: "",
        notes: "",
      });
    } catch (error: any) {
      console.error("Error recording visit:", error);
      toast.error("Failed to record ANC visit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: "normal" | "warning" | "critical") => {
    switch (status) {
      case "normal": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "warning": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "critical": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-pink-500" />
            ANC Follow-up Visit
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <Badge variant="secondary" className="text-sm">
            Gestational Age: {gestationalWeeks}w {gestationalDays}d
          </Badge>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fetal Assessment */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-500" />
              Fetal Assessment
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fundal_height">Fundal Height (cm)</Label>
                <Input
                  id="fundal_height"
                  type="number"
                  step="0.5"
                  value={formData.fundal_height}
                  onChange={(e) => setFormData({ ...formData, fundal_height: e.target.value })}
                  placeholder={`Expected: ~${gestationalWeeks}cm`}
                />
                {fundalStatus && fundalStatus.status !== "normal" && (
                  <Badge className={`mt-1 text-xs ${getStatusColor(fundalStatus.status)}`}>
                    {fundalStatus.label}
                  </Badge>
                )}
              </div>

              <div>
                <Label htmlFor="fetal_heart_rate">Fetal Heart Rate (bpm)</Label>
                <Input
                  id="fetal_heart_rate"
                  type="number"
                  value={formData.fetal_heart_rate}
                  onChange={(e) => setFormData({ ...formData, fetal_heart_rate: e.target.value })}
                  placeholder="110-160 bpm"
                />
                {fhrStatus && (
                  <Badge className={`mt-1 text-xs ${getStatusColor(fhrStatus.status)}`}>
                    {fhrStatus.label}
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fetal_presentation">Fetal Presentation</Label>
                <Select
                  value={formData.fetal_presentation}
                  onValueChange={(value) => setFormData({ ...formData, fetal_presentation: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {fetalPresentationOptions.map((pres) => (
                      <SelectItem key={pres} value={pres}>
                        {pres}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-6">
                <Label htmlFor="edema" className="text-sm">
                  Edema Present?
                </Label>
                <Switch
                  id="edema"
                  checked={formData.edema}
                  onCheckedChange={(checked) => setFormData({ ...formData, edema: checked })}
                />
              </div>
            </div>
          </div>

          {/* Maternal Vitals */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Maternal Vitals
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight_kg">Weight (kg)</Label>
                <Input
                  id="weight_kg"
                  type="number"
                  step="0.1"
                  value={formData.weight_kg}
                  onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                />
              </div>

              <div>
                <Label>Blood Pressure (mmHg)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Systolic"
                    value={formData.bp_systolic}
                    onChange={(e) => setFormData({ ...formData, bp_systolic: e.target.value })}
                  />
                  <span className="self-center">/</span>
                  <Input
                    type="number"
                    placeholder="Diastolic"
                    value={formData.bp_diastolic}
                    onChange={(e) => setFormData({ ...formData, bp_diastolic: e.target.value })}
                  />
                </div>
                {bpStatus && bpStatus.level !== "normal" && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertCircle className={`h-3 w-3 ${bpStatus.level === "critical" ? "text-red-500" : "text-amber-500"}`} />
                    <span className={`text-xs ${bpStatus.level === "critical" ? "text-red-600" : "text-amber-600"}`}>
                      {bpStatus.label}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="urine_protein">Urine Protein</Label>
                <Select
                  value={formData.urine_protein}
                  onValueChange={(value) => setFormData({ ...formData, urine_protein: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Negative">Negative</SelectItem>
                    <SelectItem value="Trace">Trace</SelectItem>
                    <SelectItem value="+">+</SelectItem>
                    <SelectItem value="++">++</SelectItem>
                    <SelectItem value="+++">+++</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="urine_glucose">Urine Glucose</Label>
                <Select
                  value={formData.urine_glucose}
                  onValueChange={(value) => setFormData({ ...formData, urine_glucose: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Negative">Negative</SelectItem>
                    <SelectItem value="Trace">Trace</SelectItem>
                    <SelectItem value="+">+</SelectItem>
                    <SelectItem value="++">++</SelectItem>
                    <SelectItem value="+++">+++</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Clinical Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any observations, concerns, or plans..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Visit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
