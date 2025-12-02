import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Activity, DollarSign, Stethoscope, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, differenceInYears } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const today = new Date();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isDoctor = profile?.role === "doctor";

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

  // Fetch monthly revenue (admin view)
  const { data: monthlyRevenue, isLoading: loadingRevenue } = useQuery({
    queryKey: ["dashboard-monthly-revenue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("total_amount")
        .eq("status", "paid")
        .gte("created_at", startOfMonth(today).toISOString())
        .lte("created_at", endOfMonth(today).toISOString());
      if (error) throw error;
      const total = data?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;
      return total;
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
    enabled: !isDoctor,
  });

  // Doctor's appointments (waiting patients) - query via staff table link
  const { data: doctorAppointments, isLoading: loadingDoctorApts } = useQuery({
    queryKey: ["doctor-appointments", user?.id],
    queryFn: async () => {
      // First find the staff record linked to this user
      const { data: staffRecord } = await supabase
        .from("staff")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (!staffRecord) return [];

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          reason_for_visit,
          status,
          patients (id, first_name, last_name, dob, gender, phone)
        `)
        .eq("doctor_id", staffRecord.id)
        .in("status", ["scheduled", "waiting"])
        .gte("appointment_date", startOfDay(today).toISOString())
        .lte("appointment_date", endOfDay(today).toISOString())
        .order("appointment_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: isDoctor && !!user?.id,
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
    {
      title: "Monthly Revenue",
      value: `$${monthlyRevenue?.toLocaleString() || "0"}`,
      icon: DollarSign,
      loading: loadingRevenue,
      color: "text-primary",
    },
  ];

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
                      <Badge variant={apt.status === "waiting" ? "default" : "secondary"}>
                        {apt.status}
                      </Badge>
                      <Button onClick={() => navigate(`/consultation/${apt.id}`)}>
                        <Stethoscope className="h-4 w-4 mr-2" />
                        Start Consultation
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