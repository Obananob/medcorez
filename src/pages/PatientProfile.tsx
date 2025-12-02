import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, Phone, Calendar, FileText } from "lucide-react";
import { differenceInYears, format } from "date-fns";

const PatientProfile = () => {
  const { id } = useParams<{ id: string }>();
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

  const calculateAge = (dob: string | null) => {
    if (!dob) return null;
    return differenceInYears(new Date(), new Date(dob));
  };

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
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate("/patients")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Patients
      </Button>

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
              Medical Information
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
              <span className="text-muted-foreground">Allergies</span>
              <span className="font-medium">{patient.allergies || "None recorded"}</span>
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

      {/* Medical History Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Medical History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Medical history timeline will be displayed here</p>
            <p className="text-sm mt-2">
              Appointments, diagnoses, and treatments will appear once recorded
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientProfile;
