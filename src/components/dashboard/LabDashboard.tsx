import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  FlaskConical, 
  TestTube, 
  CheckCircle, 
  Clock,
  Search,
  ArrowRight,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "./EmptyState";
import { format } from "date-fns";

export function LabDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchMRN, setSearchMRN] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Fetch lab stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ["lab-stats", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return null;

      // Pending tests
      const { count: pending } = await supabase
        .from("lab_requests")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", profile.organization_id)
        .eq("status", "pending");

      // Samples collected today
      const { count: collected } = await supabase
        .from("lab_requests")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", profile.organization_id)
        .eq("status", "collected")
        .gte("sample_collected_at", today.toISOString())
        .lt("sample_collected_at", tomorrow.toISOString());

      // Results completed today
      const { count: completed } = await supabase
        .from("lab_requests")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", profile.organization_id)
        .eq("status", "completed")
        .gte("completed_at", today.toISOString())
        .lt("completed_at", tomorrow.toISOString());

      return {
        pending: pending || 0,
        collected: collected || 0,
        completed: completed || 0,
      };
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch recent pending requests
  const { data: recentPending } = useQuery({
    queryKey: ["lab-recent-pending", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];

      const { data, error } = await supabase
        .from("lab_requests")
        .select(`
          *,
          patients:patient_id (first_name, last_name, medical_record_number)
        `)
        .eq("organization_id", profile.organization_id)
        .in("status", ["pending", "collected"])
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  const handleSearch = async () => {
    if (!searchMRN.trim() || !profile?.organization_id) return;
    
    setIsSearching(true);
    try {
      // First find the patient by MRN
      const { data: patient } = await supabase
        .from("patients")
        .select("id, first_name, last_name, medical_record_number")
        .eq("organization_id", profile.organization_id)
        .ilike("medical_record_number", `%${searchMRN}%`)
        .maybeSingle();

      if (patient) {
        // Then find their pending lab requests
        const { data: labRequests } = await supabase
          .from("lab_requests")
          .select("*")
          .eq("patient_id", patient.id)
          .in("status", ["pending", "collected"]);

        setSearchResult({
          patient,
          pendingTests: labRequests?.length || 0,
        });
      } else {
        setSearchResult({ notFound: true });
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-amber-500/10 text-amber-600 border-amber-200";
      case "collected": return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "completed": return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <FlaskConical className="h-8 w-8 text-primary" />
          Lab Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's your lab activity overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tests</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting sample collection</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Samples Collected</CardTitle>
            <TestTube className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats?.collected || 0}</div>
            <p className="text-xs text-muted-foreground">Collected today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Results Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{stats?.completed || 0}</div>
            <p className="text-xs text-muted-foreground">Completed today</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Quick Patient Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter Patient MRN (e.g., 2025-0001)"
              value={searchMRN}
              onChange={(e) => setSearchMRN(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>

          {searchResult && (
            <div className="p-4 rounded-lg border bg-muted/50">
              {searchResult.notFound ? (
                <p className="text-muted-foreground">No patient found with that MRN.</p>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {searchResult.patient.first_name} {searchResult.patient.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      MRN: {searchResult.patient.medical_record_number}
                    </p>
                    <p className="text-sm mt-1">
                      <span className="font-medium text-amber-600">
                        {searchResult.pendingTests}
                      </span>{" "}
                      pending lab request(s)
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/patients/${searchResult.patient.id}`)}
                  >
                    View Profile
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Pending Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Lab Requests</CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate("/lab-workspace")}>
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {recentPending && recentPending.length > 0 ? (
            <div className="space-y-3">
              {recentPending.map((request: any) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {request.patients?.first_name} {request.patients?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {request.test_name} • {request.category}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(request.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                  <Badge className={getStatusColor(request.status)}>
                    {request.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FlaskConical}
              title="No Pending Requests"
              description="All caught up! No pending lab requests at the moment."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
