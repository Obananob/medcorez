import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Stethoscope, 
  Users, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Activity
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { format, startOfDay, endOfDay, differenceInYears } from "date-fns";
import { toast } from "sonner";
import { EmptyState } from "./EmptyState";

export function DoctorDashboard() {
  const today = new Date();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(format(new Date(), "h:mm a"));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(format(new Date(), "h:mm a"));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch waiting patients (triaged patients assigned to this doctor)
  const { data: patientQueue, isLoading: loadingQueue } = useQuery({
    queryKey: ["doctor-patient-queue", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          reason_for_visit,
          status,
          patients (id, first_name, last_name, dob, gender, phone)
        `)
        .eq("doctor_id", user?.id)
        .in("status", ["waiting", "in_progress"])
        .gte("appointment_date", startOfDay(today).toISOString())
        .lte("appointment_date", endOfDay(today).toISOString())
        .order("appointment_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch vitals for priority alerts
  const { data: priorityAlerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ["doctor-priority-alerts", user?.id],
    queryFn: async () => {
      // Get today's appointments for this doctor with vitals
      const { data: appointments, error: aptError } = await supabase
        .from("appointments")
        .select(`
          id,
          status,
          patients (id, first_name, last_name)
        `)
        .eq("doctor_id", user?.id)
        .in("status", ["waiting", "in_progress"])
        .gte("appointment_date", startOfDay(today).toISOString())
        .lte("appointment_date", endOfDay(today).toISOString());
      
      if (aptError) throw aptError;
      if (!appointments?.length) return [];

      // Get vitals for these appointments
      const { data: vitals, error: vitalsError } = await supabase
        .from("vitals")
        .select("*")
        .in("appointment_id", appointments.map(a => a.id));
      
      if (vitalsError) throw vitalsError;

      // Filter for dangerous vitals
      const alerts: Array<{
        appointmentId: string;
        patientName: string;
        alertType: string;
        value: string;
        severity: "high" | "critical";
      }> = [];

      vitals?.forEach(v => {
        const apt = appointments.find(a => a.id === v.appointment_id);
        if (!apt) return;
        
        const patientName = `${apt.patients?.first_name} ${apt.patients?.last_name}`;

        // High fever (>38.5°C or >101.3°F)
        if (v.temperature && v.temperature > 38.5) {
          alerts.push({
            appointmentId: apt.id,
            patientName,
            alertType: "High Fever",
            value: `${v.temperature}°C`,
            severity: v.temperature > 39.5 ? "critical" : "high",
          });
        }

        // High BP (Systolic > 140 or Diastolic > 90)
        if (v.blood_pressure_systolic && v.blood_pressure_systolic > 140) {
          alerts.push({
            appointmentId: apt.id,
            patientName,
            alertType: "High Blood Pressure",
            value: `${v.blood_pressure_systolic}/${v.blood_pressure_diastolic} mmHg`,
            severity: v.blood_pressure_systolic > 180 ? "critical" : "high",
          });
        }

        // Low BP (Systolic < 90)
        if (v.blood_pressure_systolic && v.blood_pressure_systolic < 90) {
          alerts.push({
            appointmentId: apt.id,
            patientName,
            alertType: "Low Blood Pressure",
            value: `${v.blood_pressure_systolic}/${v.blood_pressure_diastolic} mmHg`,
            severity: "critical",
          });
        }

        // High heart rate (>100 bpm)
        if (v.heart_rate && v.heart_rate > 100) {
          alerts.push({
            appointmentId: apt.id,
            patientName,
            alertType: "Elevated Heart Rate",
            value: `${v.heart_rate} bpm`,
            severity: v.heart_rate > 120 ? "critical" : "high",
          });
        }
      });

      return alerts;
    },
    enabled: !!user?.id,
  });

  // Fetch today's stats
  const { data: todayStats, isLoading: loadingStats } = useQuery({
    queryKey: ["doctor-today-stats", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("status")
        .eq("doctor_id", user?.id)
        .gte("appointment_date", startOfDay(today).toISOString())
        .lte("appointment_date", endOfDay(today).toISOString());
      
      if (error) throw error;
      
      const completed = data?.filter(a => a.status === "completed").length || 0;
      const pending = data?.filter(a => a.status === "waiting" || a.status === "in_progress").length || 0;
      
      return { completed, pending };
    },
    enabled: !!user?.id,
  });

  const startConsultation = async (appointmentId: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: "in_progress" })
      .eq("id", appointmentId);
    
    if (error) {
      toast.error("Failed to start consultation");
      return;
    }
    navigate(`/consultation/${appointmentId}`);
  };

  const calculateAge = (dob: string | null) => {
    if (!dob) return "N/A";
    return differenceInYears(new Date(), new Date(dob));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Stethoscope className="h-8 w-8 text-primary" />
          My Workspace
        </h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, Dr. {profile?.first_name}! Here are your patients waiting.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Patients Seen Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {todayStats?.completed || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Consultations
            </CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {todayStats?.pending || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Priority Alerts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {loadingAlerts ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {priorityAlerts?.length || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Time
            </CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {currentTime}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Priority Alerts */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Priority Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAlerts ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : priorityAlerts && priorityAlerts.length > 0 ? (
              <div className="space-y-3">
                {priorityAlerts.map((alert, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-lg border ${
                      alert.severity === "critical" 
                        ? "bg-destructive/10 border-destructive/30" 
                        : "bg-warning/10 border-warning/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground text-sm">
                        {alert.patientName}
                      </span>
                      <Badge 
                        variant={alert.severity === "critical" ? "destructive" : "outline"}
                        className={alert.severity === "critical" ? "" : "border-warning text-warning"}
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {alert.alertType}: <span className="font-medium">{alert.value}</span>
                    </p>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="mt-2 h-7 text-xs"
                      onClick={() => startConsultation(alert.appointmentId)}
                    >
                      See Patient Now
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={Activity}
                title="No Alerts"
                description="All patients have normal vitals."
              />
            )}
          </CardContent>
        </Card>

        {/* Patient Queue */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Patient Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingQueue ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                  </div>
                ))}
              </div>
            ) : patientQueue && patientQueue.length > 0 ? (
              <div className="space-y-3">
                {patientQueue.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {apt.patients?.first_name} {apt.patients?.last_name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{calculateAge(apt.patients?.dob)} yrs</span>
                          <span>•</span>
                          <span className="capitalize">{apt.patients?.gender || "N/A"}</span>
                          <span>•</span>
                          <span>{format(new Date(apt.appointment_date), "h:mm a")}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {apt.reason_for_visit || "General Consultation"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {apt.status === "waiting" ? (
                        <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                          Ready
                        </Badge>
                      ) : (
                        <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                          In Progress
                        </Badge>
                      )}
                      <Button onClick={() => startConsultation(apt.id)}>
                        <Stethoscope className="h-4 w-4 mr-2" />
                        {apt.status === "in_progress" ? "Continue" : "Start"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={Stethoscope}
                title="No Patients Waiting"
                description="Your queue is clear. Great job!"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
