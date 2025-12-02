import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  DollarSign, 
  CreditCard, 
  Receipt, 
  CheckCircle, 
  Clock, 
  Pill,
  Loader2,
  Eye,
  Printer
} from "lucide-react";
import { format } from "date-fns";

const Finance = () => {
  const { profile } = useAuth();
  const { formatCurrency, organization } = useOrganization();
  const queryClient = useQueryClient();
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const isPharmacist = profile?.role === "pharmacist";

  // Fetch invoices with appointment and patient data
  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          appointments (
            id,
            appointment_date,
            consultation_fee,
            patients (first_name, last_name)
          )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch prescriptions for pharmacy
  const { data: prescriptions, isLoading: prescriptionsLoading } = useQuery({
    queryKey: ["prescriptions-pharmacy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prescriptions")
        .select(`
          *,
          appointments (
            id,
            appointment_date,
            patients (first_name, last_name)
          )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: isPharmacist,
  });

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from("invoices")
        .update({ status: "paid" })
        .eq("id", invoiceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Payment processed successfully");
    },
    onError: (error) => {
      toast.error("Failed to process payment: " + error.message);
    },
  });

  // Dispense prescription mutation
  const dispenseMutation = useMutation({
    mutationFn: async (prescription: any) => {
      // Update prescription status
      const { error: prescError } = await supabase
        .from("prescriptions")
        .update({ dispense_status: "dispensed" })
        .eq("id", prescription.id);
      if (prescError) throw prescError;

      // Deduct stock from inventory
      const { data: inventoryItem } = await supabase
        .from("inventory")
        .select("id, stock_quantity")
        .eq("item_name", prescription.medicine_name)
        .single();

      if (inventoryItem) {
        const newQuantity = Math.max(0, (inventoryItem.stock_quantity || 0) - 1);
        await supabase
          .from("inventory")
          .update({ stock_quantity: newQuantity })
          .eq("id", inventoryItem.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions-pharmacy"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Medicine dispensed successfully");
    },
    onError: (error) => {
      toast.error("Failed to dispense: " + error.message);
    },
  });

  // Filter invoices by status
  const unpaidInvoices = invoices?.filter((i) => i.status === "unpaid") || [];
  const paidInvoices = invoices?.filter((i) => i.status === "paid") || [];

  // Filter prescriptions - only paid ones for pharmacy
  const pendingPrescriptions = prescriptions?.filter((p) => {
    // Find the invoice for this appointment
    const relatedInvoice = invoices?.find((i) => i.appointment_id === p.appointment_id);
    return relatedInvoice?.status === "paid" && p.dispense_status === "pending";
  }) || [];

  const dispensedPrescriptions = prescriptions?.filter((p) => p.dispense_status === "dispensed") || [];

  // Stats
  const totalRevenue = paidInvoices.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);
  const pendingAmount = unpaidInvoices.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Pharmacy View
  if (isPharmacist) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Pill className="h-8 w-8 text-primary" />
            Pharmacy
          </h1>
          <p className="text-muted-foreground mt-1">
            Dispense medications for paid prescriptions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Dispense
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {pendingPrescriptions.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Dispensed Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {dispensedPrescriptions.length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Prescriptions to Dispense</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPrescriptions.length > 0 ? (
                  pendingPrescriptions.map((prescription) => (
                    <TableRow key={prescription.id}>
                      <TableCell className="font-medium">
                        {prescription.appointments?.patients?.first_name}{" "}
                        {prescription.appointments?.patients?.last_name}
                      </TableCell>
                      <TableCell>{prescription.medicine_name}</TableCell>
                      <TableCell>
                        {prescription.dosage} • {prescription.frequency}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-yellow-500">Pending</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => dispenseMutation.mutate(prescription)}
                          disabled={dispenseMutation.isPending}
                        >
                          {dispenseMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Dispense"
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No prescriptions pending dispense. Only paid invoices appear here.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Finance/Admin View
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <DollarSign className="h-8 w-8 text-primary" />
          Finance & Billing
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage invoices and process payments
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {formatCurrency(pendingAmount)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unpaid Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unpaidInvoices.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Tabs */}
      <Tabs defaultValue="unpaid">
        <TabsList>
          <TabsTrigger value="unpaid" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Unpaid ({unpaidInvoices.length})
          </TabsTrigger>
          <TabsTrigger value="paid" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Paid ({paidInvoices.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unpaid">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unpaidInvoices.length > 0 ? (
                    unpaidInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono text-sm">
                          INV-{invoice.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {invoice.appointments?.patients?.first_name}{" "}
                          {invoice.appointments?.patients?.last_name}
                        </TableCell>
                        <TableCell>
                          {format(new Date(invoice.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(Number(invoice.total_amount))}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            Unpaid
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedInvoice(invoice)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => processPaymentMutation.mutate(invoice.id)}
                              disabled={processPaymentMutation.isPending}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Process Payment
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No unpaid invoices
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paid">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paidInvoices.length > 0 ? (
                    paidInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono text-sm">
                          INV-{invoice.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {invoice.appointments?.patients?.first_name}{" "}
                          {invoice.appointments?.patients?.last_name}
                        </TableCell>
                        <TableCell>
                          {format(new Date(invoice.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(Number(invoice.total_amount))}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-500">Paid</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedInvoice(invoice)}
                          >
                            <Receipt className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No paid invoices yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invoice Detail Modal */}
      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Invoice Details
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              {/* Hospital Header */}
              <div className="text-center border-b pb-4">
                <h3 className="font-bold text-lg">{organization?.name || "Hospital"}</h3>
                {organization?.address && (
                  <p className="text-xs text-muted-foreground whitespace-pre-line">
                    {organization.address}
                  </p>
                )}
                {organization?.contact_phone && (
                  <p className="text-xs text-muted-foreground">
                    Tel: {organization.contact_phone}
                  </p>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice #:</span>
                  <span className="font-mono">INV-{selectedInvoice.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span>{format(new Date(selectedInvoice.created_at), "MMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Patient:</span>
                  <span>
                    {selectedInvoice.appointments?.patients?.first_name}{" "}
                    {selectedInvoice.appointments?.patients?.last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={selectedInvoice.status === "paid" ? "bg-green-500" : "bg-orange-500"}>
                    {selectedInvoice.status === "paid" ? "Paid" : "Unpaid"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(Number(selectedInvoice.total_amount))}</span>
              </div>

              {selectedInvoice.status === "unpaid" && (
                <Button
                  className="w-full"
                  onClick={() => {
                    processPaymentMutation.mutate(selectedInvoice.id);
                    setSelectedInvoice(null);
                  }}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Process Payment
                </Button>
              )}

              {selectedInvoice.status === "paid" && (
                <Button variant="outline" className="w-full" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Finance;
