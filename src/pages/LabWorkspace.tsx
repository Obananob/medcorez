import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FlaskConical, 
  Search,
  TestTube,
  FileText,
  Loader2,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { LabResultModal } from "@/components/lab/LabResultModal";

const CATEGORIES = [
  "All",
  "Hematology",
  "Serology",
  "Biochemistry",
  "Microbiology",
  "Urinalysis",
  "Parasitology",
  "Immunology",
  "General",
];

const LabWorkspace = () => {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);

  // Fetch lab requests
  const { data: labRequests, isLoading } = useQuery({
    queryKey: ["lab-requests", profile?.organization_id, statusFilter, categoryFilter],
    queryFn: async () => {
      if (!profile?.organization_id) return [];

      let query = supabase
        .from("lab_requests")
        .select(`
          *,
          patients:patient_id (first_name, last_name, medical_record_number),
          requesting_doctor:requesting_doctor_id (first_name, last_name)
        `)
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (categoryFilter !== "All") {
        query = query.eq("category", categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  // Collect sample mutation
  const collectSampleMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("lab_requests")
        .update({
          status: "collected",
          sample_collected_at: new Date().toISOString(),
          collected_by: user?.id,
        })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-requests"] });
      queryClient.invalidateQueries({ queryKey: ["lab-stats"] });
      queryClient.invalidateQueries({ queryKey: ["lab-recent-pending"] });
      toast.success("Sample collected successfully");
    },
    onError: (error) => {
      toast.error("Failed to update status: " + error.message);
    },
  });

  const filteredRequests = labRequests?.filter((request: any) => {
    const patientName = `${request.patients?.first_name} ${request.patients?.last_name}`.toLowerCase();
    const mrn = request.patients?.medical_record_number?.toLowerCase() || "";
    const testName = request.test_name.toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return patientName.includes(search) || mrn.includes(search) || testName.includes(search);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-amber-500/10 text-amber-600 border-amber-200";
      case "collected": return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "completed": return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
      case "cancelled": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleEnterResult = (request: any) => {
    setSelectedRequest(request);
    setResultModalOpen(true);
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
          Lab Workspace
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage lab requests, collect samples, and enter results
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient name, MRN, or test..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="collected">Collected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lab Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lab Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequests && filteredRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Test Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Requesting Doctor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request: any) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {request.patients?.first_name} {request.patients?.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {request.patients?.medical_record_number}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{request.test_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{request.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {request.requesting_doctor ? (
                          `Dr. ${request.requesting_doctor.first_name} ${request.requesting_doctor.last_name}`
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {request.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => collectSampleMutation.mutate(request.id)}
                              disabled={collectSampleMutation.isPending}
                            >
                              <TestTube className="h-4 w-4 mr-1" />
                              Collect
                            </Button>
                          )}
                          {request.status === "collected" && (
                            <Button
                              size="sm"
                              onClick={() => handleEnterResult(request)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Enter Result
                            </Button>
                          )}
                          {request.status === "completed" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEnterResult(request)}
                            >
                              View Result
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              icon={FlaskConical}
              title="No Lab Requests"
              description="All caught up! No lab requests match your filters."
            />
          )}
        </CardContent>
      </Card>

      {/* Result Entry Modal */}
      <LabResultModal
        open={resultModalOpen}
        onOpenChange={setResultModalOpen}
        labRequest={selectedRequest}
      />
    </div>
  );
};

export default LabWorkspace;
