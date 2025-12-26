import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ClipboardCheck, 
  UserPlus, 
  Clock,
  Calendar,
  CheckCircle,
  Users
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfDay, endOfDay, differenceInMinutes } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "./EmptyState";
import { PatientForm, PatientFormData } from "@/components/PatientForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ReceptionistDashboard() {
  const today = new Date();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PatientFormData>({
    first_name: "",
    last_name: "",
    dob: "",
    gender: "",
    phone: "",
    emergency_contact: "",
    allergies: "",
    avatar_url: "",
  });

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organization_id) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("patients").insert({
        ...formData,
        organization_id: profile.organization_id,
      });
      if (error) throw error;
      
      toast.success("Patient registered successfully");
      setRegisterOpen(false);
      setFormData({
        first_name: "", last_name: "", dob: "", gender: "",
        phone: "", emergency_contact: "", allergies: "", avatar_url: "",
      });
      queryClient.invalidateQueries({ queryKey: ["receptionist-today-schedule"] });
    } catch (error: any) {
      toast.error("Failed to register: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch today's schedule
  const { data: todaySchedule, isLoading: loadingSchedule } = useQuery({
    queryKey: ["receptionist-today-schedule"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          reason_for_visit,
          status,
          created_at,
          patients (id, first_name, last_name, medical_record_number, phone)
        `)
        .gte("appointment_date", startOfDay(today).toISOString())
        .lte("appointment_date", endOfDay(today).toISOString())
        .order("appointment_date", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate stats
  const stats = {
    totalArrivals: todaySchedule?.filter(a => a.status !== "scheduled").length || 0,
    scheduled: todaySchedule?.filter(a => a.status === "scheduled").length || 0,
    checkedIn: todaySchedule?.filter(a => 
      a.status === "waiting" || a.status === "in_progress" || a.status === "completed"
    ).length || 0,
  };

  // Calculate average waiting time
  const averageWaitTime = (() => {
    const waitingOrCompleted = todaySchedule?.filter(
      a => a.status === "waiting" || a.status === "in_progress" || a.status === "completed"
    ) || [];
    
    if (waitingOrCompleted.length === 0) return 0;
    
    const totalMinutes = waitingOrCompleted.reduce((acc, apt) => {
      const appointmentTime = new Date(apt.appointment_date);
      const now = new Date();
      // Assume check-in happened around appointment time
      const waitMinutes = Math.max(0, differenceInMinutes(now, appointmentTime));
      return acc + Math.min(waitMinutes, 120); // Cap at 2 hours
    }, 0);
    
    return Math.round(totalMinutes / waitingOrCompleted.length);
  })();

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      // Check-in sets status to "scheduled" which means they're registered and waiting for triage
      // The status flow is: scheduled -> waiting (after triage) -> in_progress -> completed
      const { error } = await supabase
        .from("appointments")
        .update({ status: "scheduled" })
        .eq("id", appointmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receptionist-today-schedule"] });
      toast.success("Patient checked in successfully");
    },
    onError: (error) => {
      toast.error("Failed to check in: " + error.message);
    },
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Awaiting Arrival</Badge>;
      case "waiting":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Checked In</Badge>;
      case "in_progress":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">With Doctor</Badge>;
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-primary" />
            Reception Desk
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage patient arrivals and appointments.
          </p>
        </div>
        <Button size="lg" onClick={() => setRegisterOpen(true)}>
          <UserPlus className="h-5 w-5 mr-2" />
          Register New Patient
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Arrivals Today
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loadingSchedule ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {stats.totalArrivals}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Awaiting Arrival
            </CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {loadingSchedule ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {stats.scheduled}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Checked In
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {loadingSchedule ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {stats.checkedIn}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Wait Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingSchedule ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {averageWaitTime} min
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSchedule ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : todaySchedule && todaySchedule.length > 0 ? (
            <div className="space-y-3">
              {todaySchedule.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <p className="text-lg font-bold text-foreground">
                        {format(new Date(apt.appointment_date), "h:mm")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(apt.appointment_date), "a")}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {apt.patients?.first_name} {apt.patients?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        MRN: {apt.patients?.medical_record_number || "N/A"}
                        {apt.patients?.phone && ` • ${apt.patients.phone}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {apt.reason_for_visit || "General Consultation"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(apt.status)}
                    {apt.status === "scheduled" && (
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/patients/${apt.patients?.id}`)}
                      >
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        View Profile
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={Calendar}
              title="No Appointments Today"
              description="The schedule is clear. Register new patients as they arrive."
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register New Patient</DialogTitle>
          </DialogHeader>
          <PatientForm 
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleRegisterPatient}
            onCancel={() => setRegisterOpen(false)}
            isLoading={isSubmitting}
            submitLabel="Register Patient"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
