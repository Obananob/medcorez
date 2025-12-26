import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  FileText, 
  Thermometer,
  Heart,
  Activity,
  Scale,
  Ruler,
  Printer,
  AlertTriangle,
  Pin,
  Image,
  Baby
} from "lucide-react";
import { differenceInYears, format } from "date-fns";
import { generatePatientPDF } from "@/utils/generatePatientPDF";
import { useOrganization } from "@/hooks/useOrganization";
import { VitalsChart } from "@/components/VitalsChart";
import { ANCJourneyTab } from "@/components/anc/ANCJourneyTab";

const PatientProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch patient's medical history (appointments with vitals and prescriptions)
  const { data: medicalHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["patient-history", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          reason_for_visit,
          diagnosis,
          status,
          consultation_fee,
          doctor_notes,
          vitals (
            temperature,
            blood_pressure_systolic,
            blood_pressure_diastolic,
            heart_rate,
            weight_kg,
            height_cm
          ),
          prescriptions (
            id,
            medicine_name,
            dosage,
            frequency,
            duration,
            prescription_image_url
          )
        `)
        .eq("patient_id", id)
        .order("appointment_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const calculateAge = (dob: string | null) => {
    if (!dob) return null;
    return differenceInYears(new Date(), new Date(dob));
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case "in_progress":
        return <Badge variant="default" className="bg-blue-500">In Progress</Badge>;
      case "triaged":
        return <Badge variant="default" className="bg-yellow-500">Triaged</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Scheduled</Badge>;
    }
  };

  const calculateBMI = (weight: number | null, height: number | null) => {
    if (!weight || !height) return null;
    const heightM = height / 100;
    return (weight / (heightM * heightM)).toFixed(1);
  };

  // Prepare data for vitals chart
  const vitalsChartData = medicalHistory?.filter(v => v.vitals?.[0])?.map(visit => ({
    date: visit.appointment_date,
    systolic: visit.vitals?.[0]?.blood_pressure_systolic,
    diastolic: visit.vitals?.[0]?.blood_pressure_diastolic,
    weight: visit.vitals?.[0]?.weight_kg,
  })) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Patient not found</p>
        <Button onClick={() => navigate("/patients")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Patients
        </Button>
      </div>
    );
  }

  const age = calculateAge(patient.dob);

  return (
    <div className="space-y-6">
      {/* Back Button & Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/patients")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Patients
        </Button>
        <Button 
          variant="outline" 
          onClick={() => generatePatientPDF(patient, medicalHistory || [], organization?.name)}
        >
          <Printer className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </div>

      {/* Patient Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-10 w-10 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">
                {patient.first_name} {patient.last_name}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                  {patient.medical_record_number || "No MRN"}
                </span>
                {age !== null && (
                  <span>{age} years old</span>
                )}
                {patient.gender && (
                  <span className="capitalize">{patient.gender}</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pinned Health Information */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Allergies - Pinned */}
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Pin className="h-4 w-4" />
              <AlertTriangle className="h-4 w-4" />
              Allergies
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patient.allergies ? (
              <div className="flex flex-wrap gap-2">
                {patient.allergies.split(",").map((allergy, i) => (
                  <Badge key={i} variant="destructive" className="text-sm">
                    {allergy.trim()}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No known allergies</p>
            )}
          </CardContent>
        </Card>

        {/* Chronic Conditions - Pinned */}
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Pin className="h-4 w-4" />
              <Activity className="h-4 w-4" />
              Chronic Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(patient as any).chronic_conditions ? (
              <div className="flex flex-wrap gap-2">
                {(patient as any).chronic_conditions.split(",").map((condition: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-sm border-orange-500 text-orange-600">
                    {condition.trim()}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No chronic conditions recorded</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vitals Chart */}
      <VitalsChart data={vitalsChartData} />

      {/* Patient Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Full Name</span>
              <span className="font-medium">
                {patient.first_name} {patient.last_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date of Birth</span>
              <span className="font-medium">
                {patient.dob
                  ? format(new Date(patient.dob), "MMMM d, yyyy")
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gender</span>
              <span className="font-medium capitalize">
                {patient.gender || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{patient.phone || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Emergency Contact</span>
              <span className="font-medium">
                {patient.emergency_contact || "-"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Medical Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">MRN</span>
              <span className="font-mono font-medium">
                {patient.medical_record_number || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Visits</span>
              <span className="font-medium">{medicalHistory?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Registered</span>
              <span className="font-medium">
                {format(new Date(patient.created_at), "MMMM d, yyyy")}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medical History Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Visit Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : medicalHistory && medicalHistory.length > 0 ? (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              
              <div className="space-y-6">
                {medicalHistory.map((visit, index) => {
                  const vitals = visit.vitals?.[0];
                  const prescriptions = visit.prescriptions || [];
                  const bmi = vitals ? calculateBMI(vitals.weight_kg, vitals.height_cm) : null;
                  const prescriptionImage = prescriptions.find(p => (p as any).prescription_image_url)?.prescription_image_url;
                  
                  return (
                    <div key={visit.id} className="relative pl-10">
                      {/* Timeline dot */}
                      <div className={`absolute left-2.5 top-2 h-3 w-3 rounded-full border-2 ${
                        visit.status === "completed" 
                          ? "bg-green-500 border-green-500" 
                          : "bg-background border-muted-foreground"
                      }`} />
                      
                      <div className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors">
                        {/* Visit Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">
                              {format(new Date(visit.appointment_date), "MMMM d, yyyy")}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(visit.appointment_date), "h:mm a")}
                            </span>
                          </div>
                          {getStatusBadge(visit.status)}
                        </div>

                        {/* Reason for Visit */}
                        {visit.reason_for_visit && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Reason: </span>
                            <span>{visit.reason_for_visit}</span>
                          </div>
                        )}

                        {/* Diagnosis */}
                        {visit.diagnosis && (
                          <div className="text-sm bg-primary/5 p-2 rounded">
                            <span className="text-muted-foreground font-medium">Diagnosis: </span>
                            <span>{visit.diagnosis}</span>
                          </div>
                        )}

                        {/* Prescription Image Thumbnail */}
                        {prescriptionImage && (
                          <a 
                            href={prescriptionImage as string} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <Image className="h-4 w-4" />
                            View Prescription Image
                          </a>
                        )}

                        {/* Vitals */}
                        {vitals && (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t">
                            {vitals.temperature && (
                              <div className="flex items-center gap-2 text-sm">
                                <Thermometer className="h-4 w-4 text-orange-500" />
                                <div>
                                  <p className="text-muted-foreground text-xs">Temp</p>
                                  <p className="font-medium">{vitals.temperature}°C</p>
                                </div>
                              </div>
                            )}
                            {(vitals.blood_pressure_systolic || vitals.blood_pressure_diastolic) && (
                              <div className="flex items-center gap-2 text-sm">
                                <Activity className="h-4 w-4 text-red-500" />
                                <div>
                                  <p className="text-muted-foreground text-xs">BP</p>
                                  <p className="font-medium">
                                    {vitals.blood_pressure_systolic || "-"}/{vitals.blood_pressure_diastolic || "-"}
                                  </p>
                                </div>
                              </div>
                            )}
                            {vitals.heart_rate && (
                              <div className="flex items-center gap-2 text-sm">
                                <Heart className="h-4 w-4 text-pink-500" />
                                <div>
                                  <p className="text-muted-foreground text-xs">Heart Rate</p>
                                  <p className="font-medium">{vitals.heart_rate} bpm</p>
                                </div>
                              </div>
                            )}
                            {vitals.weight_kg && (
                              <div className="flex items-center gap-2 text-sm">
                                <Scale className="h-4 w-4 text-blue-500" />
                                <div>
                                  <p className="text-muted-foreground text-xs">Weight</p>
                                  <p className="font-medium">{vitals.weight_kg} kg</p>
                                </div>
                              </div>
                            )}
                            {vitals.height_cm && (
                              <div className="flex items-center gap-2 text-sm">
                                <Ruler className="h-4 w-4 text-green-500" />
                                <div>
                                  <p className="text-muted-foreground text-xs">Height</p>
                                  <p className="font-medium">{vitals.height_cm} cm</p>
                                </div>
                              </div>
                            )}
                            {bmi && (
                              <div className="flex items-center gap-2 text-sm">
                                <Activity className="h-4 w-4 text-purple-500" />
                                <div>
                                  <p className="text-muted-foreground text-xs">BMI</p>
                                  <p className="font-medium">{bmi}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No medical history recorded yet</p>
              <p className="text-sm mt-2">
                Appointments and vitals will appear here once recorded
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientProfile;
