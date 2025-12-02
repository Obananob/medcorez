import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Thermometer, 
  Heart, 
  Plus, 
  Trash2,
  CheckCircle,
  Stethoscope
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { format, differenceInYears } from "date-fns";

interface Prescription {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

const Consultation = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  const [diagnosis, setDiagnosis] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [newPrescription, setNewPrescription] = useState<Prescription>({
    medicine_name: "",
    dosage: "",
    frequency: "",
    duration: "",
  });

  // Fetch appointment with patient and vitals
  const { data: appointment, isLoading } = useQuery({
    queryKey: ["consultation", appointmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          patients (id, first_name, last_name, dob, gender, phone, allergies),
          vitals (*)
        `)
        .eq("id", appointmentId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!appointmentId,
  });

  // Complete consultation mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!appointmentId || !profile?.organization_id) {
        throw new Error("Missing data");
      }

      // Update appointment with diagnosis and notes
      const { error: aptError } = await supabase
        .from("appointments")
        .update({
          status: "completed",
          diagnosis,
          doctor_notes: doctorNotes,
        })
        .eq("id", appointmentId);

      if (aptError) throw aptError;

      // Insert prescriptions
      if (prescriptions.length > 0) {
        const prescriptionData = prescriptions.map((p) => ({
          appointment_id: appointmentId,
          organization_id: profile.organization_id,
          medicine_name: p.medicine_name,
          dosage: p.dosage,
          frequency: p.frequency,
          duration: p.duration,
        }));

        const { error: prescError } = await supabase
          .from("prescriptions")
          .insert(prescriptionData);

        if (prescError) throw prescError;
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
      toast.success("Consultation completed successfully");
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error("Failed to complete consultation: " + error.message);
    },
  });

  const addPrescription = () => {
    if (!newPrescription.medicine_name) {
      toast.error("Please enter medicine name");
      return;
    }
    setPrescriptions([...prescriptions, newPrescription]);
    setNewPrescription({
      medicine_name: "",
      dosage: "",
      frequency: "",
      duration: "",
    });
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const calculateAge = (dob: string | null) => {
    if (!dob) return "N/A";
    return differenceInYears(new Date(), new Date(dob));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Appointment not found</p>
        <Button variant="link" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const vitals = appointment.vitals?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-primary" />
            Consultation Mode
          </h1>
          <p className="text-muted-foreground">
            {appointment.patients?.first_name} {appointment.patients?.last_name} •{" "}
            {format(new Date(appointment.appointment_date), "PPp")}
          </p>
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side - Patient Context */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">
                    {appointment.patients?.first_name} {appointment.patients?.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="font-medium">{calculateAge(appointment.patients?.dob)} years</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium capitalize">{appointment.patients?.gender || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{appointment.patients?.phone || "N/A"}</p>
                </div>
              </div>
              {appointment.patients?.allergies && (
                <div>
                  <p className="text-sm text-muted-foreground">Allergies</p>
                  <Badge variant="destructive" className="mt-1">
                    {appointment.patients.allergies}
                  </Badge>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Reason for Visit</p>
                <p className="font-medium">{appointment.reason_for_visit || "General Consultation"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Vitals Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Vitals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vitals ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Thermometer className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Temperature</p>
                      <p className="font-semibold">{vitals.temperature || "—"}°C</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Heart className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Blood Pressure</p>
                      <p className="font-semibold">
                        {vitals.blood_pressure_systolic}/{vitals.blood_pressure_diastolic || "—"} mmHg
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Heart className="h-5 w-5 text-pink-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Heart Rate</p>
                      <p className="font-semibold">{vitals.heart_rate || "—"} bpm</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <User className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Weight</p>
                      <p className="font-semibold">{vitals.weight_kg || "—"} kg</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No vitals recorded yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Doctor Input */}
        <div className="space-y-4">
          {/* Diagnosis */}
          <Card>
            <CardHeader>
              <CardTitle>Diagnosis</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter diagnosis..."
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Prescriptions */}
          <Card>
            <CardHeader>
              <CardTitle>Prescription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Added prescriptions */}
              {prescriptions.length > 0 && (
                <div className="space-y-2">
                  {prescriptions.map((p, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{p.medicine_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {p.dosage} • {p.frequency} • {p.duration}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePrescription(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Separator />
                </div>
              )}

              {/* Add new prescription form */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label htmlFor="medicine">Medicine Name</Label>
                  <Input
                    id="medicine"
                    placeholder="e.g., Paracetamol"
                    value={newPrescription.medicine_name}
                    onChange={(e) =>
                      setNewPrescription({ ...newPrescription, medicine_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input
                    id="dosage"
                    placeholder="e.g., 500mg"
                    value={newPrescription.dosage}
                    onChange={(e) =>
                      setNewPrescription({ ...newPrescription, dosage: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Input
                    id="frequency"
                    placeholder="e.g., 3x daily"
                    value={newPrescription.frequency}
                    onChange={(e) =>
                      setNewPrescription({ ...newPrescription, frequency: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    placeholder="e.g., 7 days"
                    value={newPrescription.duration}
                    onChange={(e) =>
                      setNewPrescription({ ...newPrescription, duration: e.target.value })
                    }
                  />
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={addPrescription}>
                <Plus className="h-4 w-4 mr-2" />
                Add Medicine
              </Button>
            </CardContent>
          </Card>

          {/* Doctor Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Private Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Private notes (not visible to patient)..."
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Complete Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            {completeMutation.isPending ? "Completing..." : "Complete Consultation"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Consultation;