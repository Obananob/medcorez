import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Activity, Stethoscope, Clock, ClipboardList, Eye } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format, startOfDay, endOfDay, differenceInYears } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { TriageModal } from "@/components/TriageModal";

const Dashboard = () => {
  const today = new Date();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isDoctor = profile?.role === "doctor";
  const isNurse = profile?.role === "nurse";
  
  // Triage modal state
  const [triageOpen, setTriageOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  // Fetch total patients count (admin view)
  const { data: patientsCount, isLoading: loadingPatients } = useQuery({
    queryKey: ["dashboard-patients-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
    enabled: !isDoctor,
  });

  // Fetch today's appointments count (admin view)
  const { data: todayAppointments, isLoading: loadingAppointments } = useQuery({
    queryKey: ["dashboard-today-appointments"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("appointment_date", startOfDay(today).toISOString())
        .lte("appointment_date", endOfDay(today).toISOString());
      if (error) throw error;
      return count || 0;
    },
    enabled: !isDoctor,
  });

  // Fetch active staff count (admin view)
  const { data: staffCount, isLoading: loadingStaff } = useQuery({
    queryKey: ["dashboard-staff-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("staff")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
    enabled: !isDoctor,
  });

  // Fetch today's appointments with patient and doctor info (admin view)
  const { data: todayAppointmentsList, isLoading: loadingTodayList } = useQuery({
    queryKey: ["dashboard-today-appointments-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          reason_for_visit,
          status,
          patient_id,
          patients (first_name, last_name),
          doctor:profiles!appointments_doctor_id_fkey (first_name, last_name)
        `)
        .gte("appointment_date", startOfDay(today).toISOString())
        .lte("appointment_date", endOfDay(today).toISOString())
        .order("appointment_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !isDoctor,
  });

  // Fetch upcoming appointments with patient info (admin view)
  const { data: upcomingAppointments, isLoading: loadingUpcoming } = useQuery({
    queryKey: ["dashboard-upcoming-appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          reason_for_visit,
          status,
          patient_id,
          patients (first_name, last_name)
        `)
        .gte("appointment_date", new Date().toISOString())
        .order("appointment_date", { ascending: true })
        .limit(4);
      if (error) throw error;
      return data || [];
    },
    enabled: !isDoctor && !isNurse,
  });

  // Doctor's appointments (waiting patients) - doctor_id references profiles.id
  const { data: doctorAppointments, isLoading: loadingDoctorApts } = useQuery({
    queryKey: ["doctor-appointments", user?.id],
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
    enabled: isDoctor && !!user?.id,
  });

  // Start consultation - update status to in_progress
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

  // Nurse's triage queue - all today's appointments with status sorting
  const { data: nurseAppointments, isLoading: loadingNurseApts } = useQuery({
    queryKey: ["nurse-triage-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          reason_for_visit,
          status,
          patients (id, first_name, last_name, dob, gender, phone),
          doctor:profiles!appointments_doctor_id_fkey (first_name, last_name)
        `)
        .gte("appointment_date", startOfDay(today).toISOString())
        .lte("appointment_date", endOfDay(today).toISOString())
        .order("appointment_date", { ascending: true });
      if (error) throw error;
      
      // Sort by status priority: scheduled -> waiting -> in_progress -> completed
      const statusOrder: Record<string, number> = {
        scheduled: 0,
        waiting: 1,
        in_progress: 2,
        completed: 3,
      };
      
      return (data || []).sort((a, b) => {
        const orderA = statusOrder[a.status || "scheduled"] ?? 4;
        const orderB = statusOrder[b.status || "scheduled"] ?? 4;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime();
      });
    },
    enabled: isNurse,
  });

  const calculateAge = (dob: string | null) => {
    if (!dob) return "N/A";
    return differenceInYears(new Date(), new Date(dob));
  };

  const stats = [
    {
      title: "Total Patients",
      value: patientsCount?.toString() || "0",
      icon: Users,
      loading: loadingPatients,
      color: "text-primary",
    },
    {
      title: "Today's Appointments",
      value: todayAppointments?.toString() || "0",
      icon: Calendar,
      loading: loadingAppointments,
      color: "text-success",
    },
    {
      title: "Active Staff",
      value: staffCount?.toString() || "0",
      icon: Activity,
      loading: loadingStaff,
      color: "text-warning",
    },
  ];

  // Status badge configuration
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Needs Triage</Badge>;
      case "waiting":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Waiting for Doctor</Badge>;
      case "in_progress":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">With Doctor</Badge>;
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Discharged</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleTriageClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    setTriageOpen(true);
  };

  const handleTriageSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["nurse-triage-queue"] });
  };

  // Nurse Dashboard View
  if (isNurse) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-primary" />
            Nurse Station
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's today's triage queue.
          </p>
        </div>

        {/* Nurse Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Needs Triage
              </CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {nurseAppointments?.filter(a => a.status === "scheduled").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Waiting for Doctor
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {nurseAppointments?.filter(a => a.status === "waiting").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                With Doctor
              </CardTitle>
              <Stethoscope className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {nurseAppointments?.filter(a => a.status === "in_progress").length || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Discharged Today
              </CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {nurseAppointments?.filter(a => a.status === "completed").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Triage Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Today's Patient Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingNurseApts ? (
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
            ) : nurseAppointments && nurseAppointments.length > 0 ? (
              <div className="space-y-3">
                {nurseAppointments.map((apt) => (
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
                          {apt.doctor && (
                            <>
                              <span>•</span>
                              <span>Dr. {apt.doctor.first_name}</span>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {apt.reason_for_visit || "General Consultation"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(apt.status)}
                      {apt.status === "scheduled" ? (
                        <Button onClick={() => handleTriageClick(apt)}>
                          <Activity className="h-4 w-4 mr-2" />
                          Triage Patient
                        </Button>
                      ) : apt.status === "waiting" || apt.status === "in_progress" ? (
                        <span className="text-sm text-muted-foreground">Vitals Recorded</span>
                      ) : apt.status === "completed" ? (
                        <Button variant="outline" size="sm" onClick={() => navigate(`/consultation/${apt.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Summary
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No appointments scheduled for today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Triage Modal */}
        <TriageModal
          open={triageOpen}
          onOpenChange={setTriageOpen}
          appointment={selectedAppointment}
          onSuccess={handleTriageSuccess}
        />
      </div>
    );
  }

  // Doctor Dashboard View
  if (isDoctor) {
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

        {/* Doctor Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Waiting Patients
              </CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {doctorAppointments?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today's Date
              </CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {format(today, "MMM d")}
              </div>
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
                {format(today, "h:mm a")}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Waiting Patients List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              My Patients Waiting
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDoctorApts ? (
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
            ) : doctorAppointments && doctorAppointments.length > 0 ? (
              <div className="space-y-4">
                {doctorAppointments.map((apt) => (
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
                        <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Ready for Consult</Badge>
                      ) : (
                        <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">In Progress</Badge>
                      )}
                      <Button onClick={() => startConsultation(apt.id)}>
                        <Stethoscope className="h-4 w-4 mr-2" />
                        {apt.status === "in_progress" ? "Continue" : "Start Consultation"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No patients waiting</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your queue is clear. Great job!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin Dashboard View (original)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {stat.loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Today's Appointments Section */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTodayList ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : todayAppointmentsList && todayAppointmentsList.length > 0 ? (
              <div className="space-y-3">
                {todayAppointmentsList.map((apt) => (
                  <div key={apt.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {apt.patients?.first_name} {apt.patients?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(apt.appointment_date), "h:mm a")}
                        {apt.doctor && ` • Dr. ${apt.doctor.first_name} ${apt.doctor.last_name}`}
                      </p>
                    </div>
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded capitalize">
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No appointments scheduled for today
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUpcoming ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : upcomingAppointments && upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {apt.patients?.first_name} {apt.patients?.last_name} - {apt.reason_for_visit || "Consultation"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(apt.appointment_date), "MMM d, h:mm a")}
                      </p>
                    </div>
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded capitalize">
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No upcoming appointments scheduled
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;