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
  Thermometer, 
  Heart, 
  Plus, 
  Trash2,
  CheckCircle,
  Stethoscope,
  Pill,
  Search,
  Calendar,
  DollarSign
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { format, differenceInYears } from "date-fns";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Prescription {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  price?: number;
}

const Consultation = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { currencySymbol, formatCurrency } = useOrganization();
  
  const [diagnosis, setDiagnosis] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [medicineOpen, setMedicineOpen] = useState(false);
  const [medicineSearch, setMedicineSearch] = useState("");
  const [newPrescription, setNewPrescription] = useState<Prescription>({
    medicine_name: "",
    dosage: "",
    frequency: "",
    duration: "",
    price: 0,
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

  // Fetch patient history (past appointments)
  const { data: patientHistory } = useQuery({
    queryKey: ["patient-history", appointment?.patients?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, appointment_date, diagnosis, status")
        .eq("patient_id", appointment?.patients?.id)
        .neq("id", appointmentId)
        .eq("status", "completed")
        .order("appointment_date", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!appointment?.patients?.id,
  });

  // Fetch inventory for medicine autocomplete
  const { data: inventoryItems } = useQuery({
    queryKey: ["inventory-medicines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("id, item_name, stock_quantity, price_per_unit")
        .gt("stock_quantity", 0)
        .order("item_name");
      if (error) throw error;
      return data || [];
    },
  });

  const filteredMedicines = inventoryItems?.filter((item) =>
    item.item_name.toLowerCase().includes(medicineSearch.toLowerCase())
  ) || [];

  // Calculate total
  const medicineTotal = prescriptions.reduce((sum, p) => sum + (p.price || 0), 0);
  const consultationFeeNum = parseFloat(consultationFee) || 0;
  const totalAmount = consultationFeeNum + medicineTotal;

  // Complete consultation mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!appointmentId || !profile?.organization_id) {
        throw new Error("Missing data");
      }

      // Update appointment with diagnosis, notes, and consultation fee
      const { error: aptError } = await supabase
        .from("appointments")
        .update({
          status: "completed",
          diagnosis,
          doctor_notes: doctorNotes,
          consultation_fee: consultationFeeNum,
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

      // Create invoice
      const { error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          organization_id: profile.organization_id,
          appointment_id: appointmentId,
          total_amount: totalAmount,
          status: "unpaid",
        });

      if (invoiceError) throw invoiceError;

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Consultation completed. Invoice created.");
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
      price: 0,
    });
    setMedicineSearch("");
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

          {/* Patient History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Visit History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patientHistory && patientHistory.length > 0 ? (
                <div className="space-y-2">
                  {patientHistory.map((visit) => (
                    <div
                      key={visit.id}
                      className="p-3 rounded-lg bg-muted/50 text-sm"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          {format(new Date(visit.appointment_date), "MMM d, yyyy")}
                        </span>
                        <Badge variant="outline" className="text-green-600">Completed</Badge>
                      </div>
                      <p className="mt-1 font-medium">{visit.diagnosis || "No diagnosis recorded"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No previous visits
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Doctor Input */}
        <div className="space-y-4">
          {/* Consultation Fee */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Consultation Fee
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">{currencySymbol}</span>
                <Input
                  type="number"
                  placeholder="Enter consultation fee"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(e.target.value)}
                  className="text-lg"
                />
              </div>
            </CardContent>
          </Card>

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
                      <div className="flex-1">
                        <p className="font-medium">{p.medicine_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {p.dosage} • {p.frequency} • {p.duration}
                        </p>
                      </div>
                      {p.price && p.price > 0 && (
                        <span className="text-sm font-medium text-green-600 mr-2">
                          {formatCurrency(p.price)}
                        </span>
                      )}
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
                  <Label>Medicine Name</Label>
                  <Popover open={medicineOpen} onOpenChange={setMedicineOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={medicineOpen}
                        className="w-full justify-between font-normal"
                      >
                        {newPrescription.medicine_name || "Search medicine from inventory..."}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder="Search medicine..." 
                          value={medicineSearch}
                          onValueChange={setMedicineSearch}
                        />
                        <CommandList>
                          <CommandEmpty>
                            <div className="p-2 text-center">
                              <p className="text-sm text-muted-foreground">No medicine found in inventory</p>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="mt-2"
                                onClick={() => {
                                  setNewPrescription({ ...newPrescription, medicine_name: medicineSearch, price: 0 });
                                  setMedicineOpen(false);
                                }}
                              >
                                Use "{medicineSearch}" anyway
                              </Button>
                            </div>
                          </CommandEmpty>
                          <CommandGroup heading="Available Medicines">
                            {filteredMedicines.map((item) => (
                              <CommandItem
                                key={item.id}
                                value={item.item_name}
                                onSelect={() => {
                                  setNewPrescription({ 
                                    ...newPrescription, 
                                    medicine_name: item.item_name,
                                    price: item.price_per_unit || 0
                                  });
                                  setMedicineSearch("");
                                  setMedicineOpen(false);
                                }}
                              >
                                <Pill className="mr-2 h-4 w-4" />
                                <span className="flex-1">{item.item_name}</span>
                                <span className="text-sm text-muted-foreground mr-2">
                                  {formatCurrency(item.price_per_unit)}
                                </span>
                                <Badge variant="secondary">
                                  {item.stock_quantity} in stock
                                </Badge>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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

          {/* Bill Summary */}
          <Card className="border-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Bill Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Consultation Fee</span>
                <span>{formatCurrency(consultationFeeNum)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Medicines ({prescriptions.length} items)</span>
                <span>{formatCurrency(medicineTotal)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(totalAmount)}</span>
              </div>
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
            {completeMutation.isPending ? "Completing..." : "Complete & Generate Invoice"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Consultation;
