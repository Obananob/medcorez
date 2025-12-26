import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Baby,
  Calendar,
  Clock,
  Plus,
  Heart,
  Activity,
  Scale,
  AlertCircle,
  Droplets,
} from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ANCEnrollmentModal } from "./ANCEnrollmentModal";
import { ANCVisitModal } from "./ANCVisitModal";
import {
  calculateGestationalAge,
  formatGestationalAge,
  calculateDaysToDelivery,
  getTrimester,
  getFetalHeartRateStatus,
} from "@/utils/ancUtils";
import { getBPStatus } from "@/utils/cdssUtils";

interface ANCJourneyTabProps {
  patientId: string;
  patientName: string;
}

export function ANCJourneyTab({ patientId, patientName }: ANCJourneyTabProps) {
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [showVisit, setShowVisit] = useState(false);

  // Fetch active ANC enrollment
  const { data: enrollment, isLoading: loadingEnrollment } = useQuery({
    queryKey: ["anc-enrollment", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anc_enrollments")
        .select("*")
        .eq("patient_id", patientId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch ANC visits for enrollment
  const { data: visits, isLoading: loadingVisits } = useQuery({
    queryKey: ["anc-visits", enrollment?.id],
    queryFn: async () => {
      if (!enrollment?.id) return [];
      const { data, error } = await supabase
        .from("anc_visits")
        .select("*")
        .eq("enrollment_id", enrollment.id)
        .order("visit_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!enrollment?.id,
  });

  if (loadingEnrollment) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  // No enrollment yet
  if (!enrollment) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={Baby}
          title="Not enrolled in ANC"
          description="Enroll this patient in antenatal care to track their pregnancy journey"
        />
        <div className="flex justify-center">
          <Button onClick={() => setShowEnrollment(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Enroll in ANC
          </Button>
        </div>
        <ANCEnrollmentModal
          open={showEnrollment}
          onOpenChange={setShowEnrollment}
          patientId={patientId}
          patientName={patientName}
        />
      </div>
    );
  }

  // Calculate current status
  const lmpDate = new Date(enrollment.lmp);
  const eddDate = new Date(enrollment.edd);
  const gestationalAge = calculateGestationalAge(lmpDate);
  const daysToDelivery = calculateDaysToDelivery(eddDate);
  const trimester = getTrimester(gestationalAge.weeks);

  const getStatusColor = (level: "normal" | "warning" | "critical") => {
    switch (level) {
      case "normal": return "text-green-600";
      case "warning": return "text-amber-600";
      case "critical": return "text-red-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Pregnancy Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/30 dark:to-pink-900/20 border-pink-200 dark:border-pink-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 mb-2">
              <Baby className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Weeks Pregnant</span>
            </div>
            <p className="text-2xl font-bold text-pink-700 dark:text-pink-300">
              {formatGestationalAge(gestationalAge.weeks, gestationalAge.days)}
            </p>
            <Badge variant="outline" className="mt-2 text-xs">
              {trimester.label}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">EDD</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {format(eddDate, "MMM d, yyyy")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Days to Delivery</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {daysToDelivery > 0 ? daysToDelivery : "Due!"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Droplets className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Blood Group</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-foreground">
                {enrollment.blood_group || "—"}
              </p>
              {enrollment.genotype && (
                <Badge variant="secondary">{enrollment.genotype}</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrollment Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Pregnancy Details</span>
            <Badge variant="outline">
              G{enrollment.gravida}P{enrollment.para}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">LMP:</span>
              <span className="font-medium">{format(lmpDate, "MMMM d, yyyy")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">HIV Status:</span>
              <span className={`font-medium ${enrollment.hiv_status === "Positive" ? "text-red-600" : ""}`}>
                {enrollment.hiv_status || "Unknown"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Visits:</span>
              <span className="font-medium">{visits?.length || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visits History */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">ANC Visits</CardTitle>
            <Button size="sm" onClick={() => setShowVisit(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Visit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingVisits ? (
            <Skeleton className="h-32 w-full" />
          ) : visits && visits.length > 0 ? (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>GA</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>BP</TableHead>
                    <TableHead>FHR</TableHead>
                    <TableHead>Fundal Ht</TableHead>
                    <TableHead>Presentation</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.map((visit: any) => {
                    const fhrStatus = visit.fetal_heart_rate ? getFetalHeartRateStatus(visit.fetal_heart_rate) : null;
                    const bpStatus = visit.blood_pressure_systolic && visit.blood_pressure_diastolic 
                      ? getBPStatus(visit.blood_pressure_systolic, visit.blood_pressure_diastolic) 
                      : null;

                    return (
                      <TableRow key={visit.id}>
                        <TableCell className="font-medium">
                          {format(new Date(visit.visit_date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {visit.gestational_age_weeks}w {visit.gestational_age_days}d
                        </TableCell>
                        <TableCell>
                          {visit.weight_kg ? (
                            <div className="flex items-center gap-1">
                              <Scale className="h-3 w-3 text-muted-foreground" />
                              {visit.weight_kg} kg
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          {visit.blood_pressure_systolic && visit.blood_pressure_diastolic ? (
                            <div className="flex items-center gap-1">
                              <Activity className={`h-3 w-3 ${bpStatus ? getStatusColor(bpStatus.level) : "text-muted-foreground"}`} />
                              <span className={bpStatus && bpStatus.level !== "normal" ? getStatusColor(bpStatus.level) : ""}>
                                {visit.blood_pressure_systolic}/{visit.blood_pressure_diastolic}
                              </span>
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          {visit.fetal_heart_rate ? (
                            <div className="flex items-center gap-1">
                              <Heart className={`h-3 w-3 ${fhrStatus ? getStatusColor(fhrStatus.status) : "text-muted-foreground"}`} />
                              <span className={fhrStatus && fhrStatus.status !== "normal" ? getStatusColor(fhrStatus.status) : ""}>
                                {visit.fetal_heart_rate}
                              </span>
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          {visit.fundal_height_cm ? `${visit.fundal_height_cm} cm` : "—"}
                        </TableCell>
                        <TableCell>
                          {visit.fetal_presentation || "—"}
                          {visit.edema && (
                            <Badge variant="destructive" className="ml-2 text-xs">Edema</Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {visit.notes || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="No visits recorded"
              description="Record the first ANC visit for this pregnancy"
            />
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ANCEnrollmentModal
        open={showEnrollment}
        onOpenChange={setShowEnrollment}
        patientId={patientId}
        patientName={patientName}
      />
      
      <ANCVisitModal
        open={showVisit}
        onOpenChange={setShowVisit}
        enrollmentId={enrollment.id}
        patientId={patientId}
        gestationalWeeks={gestationalAge.weeks}
        gestationalDays={gestationalAge.days}
      />
    </div>
  );
}
