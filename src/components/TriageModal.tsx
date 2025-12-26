import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Thermometer, Heart, Scale, Ruler, Activity, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { 
  getTemperatureStatus, 
  getBPStatus, 
  calculateBMI 
} from "@/utils/cdssUtils";

interface TriageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: {
    id: string;
    patients: {
      first_name: string;
      last_name: string;
    } | null;
  } | null;
  onSuccess: () => void;
}

export function TriageModal({ open, onOpenChange, appointment, onSuccess }: TriageModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [vitals, setVitals] = useState({
    temperature: "",
    bp_systolic: "",
    bp_diastolic: "",
    heart_rate: "",
    weight: "",
    height: "",
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setVitals({
        temperature: "",
        bp_systolic: "",
        bp_diastolic: "",
        heart_rate: "",
        weight: "",
        height: "",
      });
    }
  }, [open]);

  // CDSS: Calculate BMI using utility
  const bmiResult = calculateBMI(
    vitals.weight ? parseFloat(vitals.weight) : null,
    vitals.height ? parseFloat(vitals.height) : null
  );

  // CDSS: Get temperature status
  const tempStatus = getTemperatureStatus(vitals.temperature ? parseFloat(vitals.temperature) : null);
  
  // CDSS: Get BP status
  const bpStatus = getBPStatus(
    vitals.bp_systolic ? parseInt(vitals.bp_systolic) : null,
    vitals.bp_diastolic ? parseInt(vitals.bp_diastolic) : null
  );

  const handleSaveVitals = async () => {
    if (!appointment || !profile?.organization_id) return;

    setLoading(true);
    try {
      // Save vitals
      const { error: vitalsError } = await supabase.from("vitals").insert({
        appointment_id: appointment.id,
        temperature: vitals.temperature ? parseFloat(vitals.temperature) : null,
        blood_pressure_systolic: vitals.bp_systolic ? parseInt(vitals.bp_systolic) : null,
        blood_pressure_diastolic: vitals.bp_diastolic ? parseInt(vitals.bp_diastolic) : null,
        heart_rate: vitals.heart_rate ? parseInt(vitals.heart_rate) : null,
        weight_kg: vitals.weight ? parseFloat(vitals.weight) : null,
        height_cm: vitals.height ? parseFloat(vitals.height) : null,
      });

      if (vitalsError) throw vitalsError;

      // Update appointment status to 'waiting'
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ status: "waiting" })
        .eq("id", appointment.id);

      if (updateError) throw updateError;

      toast({
        title: "Patient sent to Doctor",
        description: `${appointment.patients?.first_name} ${appointment.patients?.last_name} is now waiting for the doctor.`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error saving vitals",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Triage Patient
          </DialogTitle>
          {appointment?.patients && (
            <p className="text-muted-foreground">
              Recording vitals for {appointment.patients.first_name} {appointment.patients.last_name}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* CDSS Alerts */}
          {(tempStatus && tempStatus.level !== "normal") && (
            <div className={`flex items-center gap-2 p-3 rounded-lg border ${tempStatus.bgClass}`}>
              <AlertTriangle className={`h-5 w-5 ${tempStatus.colorClass}`} />
              <Badge className={tempStatus.level === "critical" ? "bg-red-600" : "bg-orange-500"}>
                {tempStatus.label}
              </Badge>
              <span className={`text-sm ${tempStatus.colorClass}`}>
                {tempStatus.level === "critical" ? "Immediate attention required" : "Monitor closely"}
              </span>
            </div>
          )}
          
          {(bpStatus && bpStatus.level !== "normal") && (
            <div className={`flex items-center gap-2 p-3 rounded-lg border ${bpStatus.bgClass}`}>
              <AlertTriangle className={`h-5 w-5 ${bpStatus.colorClass}`} />
              <Badge className={bpStatus.level === "critical" ? "bg-red-600" : "bg-orange-500"}>
                {bpStatus.label}
              </Badge>
              <span className={`text-sm ${bpStatus.colorClass}`}>
                {bpStatus.level === "critical" ? "Hypertensive urgency" : "Elevated blood pressure"}
              </span>
            </div>
          )}

          {/* Temperature */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-muted-foreground" />
              Temperature (°C)
              {tempStatus && tempStatus.level !== "normal" && (
                <Badge variant="outline" className={tempStatus.colorClass}>
                  {tempStatus.label}
                </Badge>
              )}
            </Label>
            <Input
              type="number"
              step="0.1"
              placeholder="36.5"
              value={vitals.temperature}
              onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
              className={tempStatus && tempStatus.level !== "normal" ? `border-2 ${tempStatus.level === "critical" ? "border-red-500" : "border-orange-500"}` : ""}
            />
          </div>

          {/* Blood Pressure */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-muted-foreground" />
              Blood Pressure (mmHg)
              {bpStatus && bpStatus.level !== "normal" && (
                <Badge variant="outline" className={bpStatus.colorClass}>
                  {bpStatus.label}
                </Badge>
              )}
            </Label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                placeholder="120"
                value={vitals.bp_systolic}
                onChange={(e) => setVitals({ ...vitals, bp_systolic: e.target.value })}
                className={bpStatus && bpStatus.level !== "normal" ? `border-2 ${bpStatus.level === "critical" ? "border-red-500" : "border-orange-500"}` : ""}
              />
              <span className="text-muted-foreground">/</span>
              <Input
                type="number"
                placeholder="80"
                value={vitals.bp_diastolic}
                onChange={(e) => setVitals({ ...vitals, bp_diastolic: e.target.value })}
                className={bpStatus && bpStatus.level !== "normal" ? `border-2 ${bpStatus.level === "critical" ? "border-red-500" : "border-orange-500"}` : ""}
              />
            </div>
          </div>

          {/* Heart Rate */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Heart Rate (bpm)
            </Label>
            <Input
              type="number"
              placeholder="72"
              value={vitals.heart_rate}
              onChange={(e) => setVitals({ ...vitals, heart_rate: e.target.value })}
            />
          </div>

          {/* Weight & Height */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-muted-foreground" />
                Weight (kg)
              </Label>
              <Input
                type="number"
                step="0.1"
                placeholder="70"
                value={vitals.weight}
                onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                Height (cm)
              </Label>
              <Input
                type="number"
                placeholder="170"
                value={vitals.height}
                onChange={(e) => setVitals({ ...vitals, height: e.target.value })}
              />
            </div>
          </div>

          {/* Auto BMI Display with CDSS color coding */}
          {bmiResult && (
            <div className={`p-3 rounded-lg border ${
              bmiResult.level === "critical" 
                ? "bg-red-500/10 border-red-500/30" 
                : bmiResult.level === "warning" 
                  ? "bg-orange-500/10 border-orange-500/30"
                  : "bg-green-500/10 border-green-500/30"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Calculated BMI</span>
                <Badge variant="outline" className={`text-lg font-semibold ${bmiResult.colorClass}`}>
                  {bmiResult.value}
                </Badge>
              </div>
              <p className={`text-sm mt-1 font-medium ${bmiResult.colorClass}`}>
                {bmiResult.category}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveVitals} disabled={loading}>
            {loading ? "Saving..." : "Save Vitals"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
