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

  // Calculate BMI
  const calculateBMI = () => {
    const weight = parseFloat(vitals.weight);
    const heightCm = parseFloat(vitals.height);
    if (weight && heightCm) {
      const heightM = heightCm / 100;
      const bmi = weight / (heightM * heightM);
      return bmi.toFixed(1);
    }
    return null;
  };

  const bmi = calculateBMI();
  const hasFever = parseFloat(vitals.temperature) > 38;

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
          {/* Fever Alert */}
          {hasFever && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <Badge variant="destructive">High Fever</Badge>
              <span className="text-sm text-destructive">Temperature exceeds 38°C</span>
            </div>
          )}

          {/* Temperature */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-muted-foreground" />
              Temperature (°C)
            </Label>
            <Input
              type="number"
              step="0.1"
              placeholder="36.5"
              value={vitals.temperature}
              onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
            />
          </div>

          {/* Blood Pressure */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-muted-foreground" />
              Blood Pressure (mmHg)
            </Label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                placeholder="120"
                value={vitals.bp_systolic}
                onChange={(e) => setVitals({ ...vitals, bp_systolic: e.target.value })}
              />
              <span className="text-muted-foreground">/</span>
              <Input
                type="number"
                placeholder="80"
                value={vitals.bp_diastolic}
                onChange={(e) => setVitals({ ...vitals, bp_diastolic: e.target.value })}
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

          {/* Auto BMI Display */}
          {bmi && (
            <div className="p-3 rounded-lg bg-muted">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Calculated BMI</span>
                <Badge variant="outline" className="text-lg font-semibold">
                  {bmi}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {parseFloat(bmi) < 18.5
                  ? "Underweight"
                  : parseFloat(bmi) < 25
                  ? "Normal weight"
                  : parseFloat(bmi) < 30
                  ? "Overweight"
                  : "Obese"}
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
