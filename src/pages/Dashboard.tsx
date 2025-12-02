import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Activity, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";

const Dashboard = () => {
  const today = new Date();

  // Fetch total patients count
  const { data: patientsCount, isLoading: loadingPatients } = useQuery({
    queryKey: ["dashboard-patients-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch today's appointments count
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
  });

  // Fetch active staff count
  const { data: staffCount, isLoading: loadingStaff } = useQuery({
    queryKey: ["dashboard-staff-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch monthly revenue
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
  });

  // Fetch upcoming appointments with patient info
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
  });

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

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Patients</span>
                <span className="text-sm font-medium text-foreground">{patientsCount || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Today's Appointments</span>
                <span className="text-sm font-medium text-foreground">{todayAppointments || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Staff Members</span>
                <span className="text-sm font-medium text-foreground">{staffCount || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Revenue (This Month)</span>
                <span className="text-sm font-medium text-foreground">${monthlyRevenue?.toLocaleString() || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
