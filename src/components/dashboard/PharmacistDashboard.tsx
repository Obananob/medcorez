import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Pill, 
  Package, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, endOfDay, addDays } from "date-fns";
import { toast } from "sonner";
import { EmptyState } from "./EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function PharmacistDashboard() {
  const today = new Date();
  const queryClient = useQueryClient();
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch paid prescriptions queue
  const { data: prescriptionQueue, isLoading: loadingQueue } = useQuery({
    queryKey: ["pharmacist-prescription-queue"],
    queryFn: async () => {
      // First get paid invoices with appointments
      const { data: invoices, error: invoiceError } = await supabase
        .from("invoices")
        .select(`
          id,
          appointment_id,
          status,
          appointments (
            id,
            patient_id,
            patients (first_name, last_name, medical_record_number)
          )
        `)
        .eq("status", "paid")
        .gte("created_at", startOfDay(today).toISOString())
        .lte("created_at", endOfDay(today).toISOString());

      if (invoiceError) throw invoiceError;
      if (!invoices?.length) return [];

      const appointmentIds = invoices
        .filter(i => i.appointment_id)
        .map(i => i.appointment_id as string);

      if (!appointmentIds.length) return [];

      // Get prescriptions for these appointments that are pending
      const { data: prescriptions, error: rxError } = await supabase
        .from("prescriptions")
        .select("*")
        .in("appointment_id", appointmentIds)
        .eq("dispense_status", "pending");

      if (rxError) throw rxError;

      // Map prescriptions with patient info
      return (prescriptions || []).map(rx => {
        const invoice = invoices.find(i => i.appointment_id === rx.appointment_id);
        return {
          ...rx,
          patient: invoice?.appointments?.patients,
        };
      });
    },
  });

  // Fetch inventory snapshot (low stock items)
  const { data: lowStockItems, isLoading: loadingInventory } = useQuery({
    queryKey: ["pharmacist-low-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .or("stock_quantity.lt.10,stock_quantity.is.null")
        .order("stock_quantity", { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch expiring soon items (within 30 days)
  const { data: expiringItems, isLoading: loadingExpiring } = useQuery({
    queryKey: ["pharmacist-expiring-items"],
    queryFn: async () => {
      const thirtyDaysFromNow = addDays(today, 30);
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .not("expiry_date", "is", null)
        .lte("expiry_date", thirtyDaysFromNow.toISOString().split("T")[0])
        .gte("expiry_date", today.toISOString().split("T")[0])
        .order("expiry_date", { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Dispense mutation
  const dispenseMutation = useMutation({
    mutationFn: async (prescriptionId: string) => {
      const { error } = await supabase
        .from("prescriptions")
        .update({ dispense_status: "dispensed" })
        .eq("id", prescriptionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pharmacist-prescription-queue"] });
      toast.success("Prescription marked as dispensed");
      setDetailsOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to dispense: " + error.message);
    },
  });

  const handleQuickDispense = (prescription: any) => {
    setSelectedPrescription(prescription);
    setDetailsOpen(true);
  };

  const stats = {
    pending: prescriptionQueue?.length || 0,
    lowStock: lowStockItems?.length || 0,
    expiringSoon: expiringItems?.length || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Pill className="h-8 w-8 text-primary" />
          Pharmacy Station
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage prescriptions and inventory at a glance.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Prescriptions
            </CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {loadingQueue ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {stats.pending}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock Items
            </CardTitle>
            <Package className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {loadingInventory ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {stats.lowStock}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expiring Soon
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {loadingExpiring ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {stats.expiringSoon}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Prescription Queue */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Prescription Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingQueue ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : prescriptionQueue && prescriptionQueue.length > 0 ? (
              <div className="space-y-3">
                {prescriptionQueue.map((rx) => (
                  <div
                    key={rx.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Pill className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {rx.patient?.first_name} {rx.patient?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          MRN: {rx.patient?.medical_record_number || "N/A"}
                        </p>
                        <p className="text-sm font-medium text-primary mt-1">
                          {rx.medicine_name} - {rx.dosage}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                        Paid
                      </Badge>
                      <Button 
                        size="sm"
                        onClick={() => handleQuickDispense(rx)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Quick Dispense
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={Pill}
                title="All Caught Up!"
                description="No pending prescriptions at the moment."
              />
            )}
          </CardContent>
        </Card>

        {/* Inventory Snapshot */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventory Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Low Stock */}
            <div>
              <h4 className="text-sm font-medium text-destructive mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Low Stock
              </h4>
              {loadingInventory ? (
                <div className="space-y-2">
                  {[1, 2].map(i => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : lowStockItems && lowStockItems.length > 0 ? (
                <div className="space-y-2">
                  {lowStockItems.map(item => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between text-sm p-2 rounded bg-destructive/5"
                    >
                      <span className="text-foreground">{item.item_name}</span>
                      <Badge variant="destructive" className="text-xs">
                        {item.stock_quantity ?? 0} left
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">All items well stocked</p>
              )}
            </div>

            {/* Expiring Soon */}
            <div>
              <h4 className="text-sm font-medium text-warning mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Expiring Soon
              </h4>
              {loadingExpiring ? (
                <div className="space-y-2">
                  {[1, 2].map(i => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : expiringItems && expiringItems.length > 0 ? (
                <div className="space-y-2">
                  {expiringItems.map(item => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between text-sm p-2 rounded bg-warning/5"
                    >
                      <span className="text-foreground">{item.item_name}</span>
                      <Badge variant="outline" className="text-xs border-warning text-warning">
                        {format(new Date(item.expiry_date!), "MMM d")}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No items expiring soon</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prescription Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
          </DialogHeader>
          {selectedPrescription && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Patient</p>
                <p className="font-semibold text-foreground">
                  {selectedPrescription.patient?.first_name} {selectedPrescription.patient?.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  MRN: {selectedPrescription.patient?.medical_record_number || "N/A"}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Medicine</span>
                  <span className="font-medium text-foreground">{selectedPrescription.medicine_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dosage</span>
                  <span className="font-medium text-foreground">{selectedPrescription.dosage || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frequency</span>
                  <span className="font-medium text-foreground">{selectedPrescription.frequency || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium text-foreground">{selectedPrescription.duration || "N/A"}</span>
                </div>
                {selectedPrescription.notes && (
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground text-sm">Notes</span>
                    <p className="text-foreground">{selectedPrescription.notes}</p>
                  </div>
                )}
              </div>

              <Button 
                className="w-full" 
                onClick={() => dispenseMutation.mutate(selectedPrescription.id)}
                disabled={dispenseMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {dispenseMutation.isPending ? "Processing..." : "Mark as Dispensed"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
