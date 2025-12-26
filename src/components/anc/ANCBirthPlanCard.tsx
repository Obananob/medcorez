import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardList, Droplets, Car, Save, Edit2 } from "lucide-react";
import { toast } from "sonner";

interface BirthPlanData {
  expected_delivery_mode?: string | null;
  blood_donor_name?: string | null;
  blood_donor_phone?: string | null;
  emergency_transport_plan?: string | null;
}

interface ANCBirthPlanCardProps {
  enrollmentId: string;
  birthPlan: BirthPlanData;
}

const deliveryModes = [
  { value: "vaginal", label: "Vaginal Delivery" },
  { value: "elective_cs", label: "Elective C-Section" },
  { value: "vbac", label: "VBAC (Vaginal Birth After Cesarean)" },
  { value: "unknown", label: "To Be Determined" },
];

export function ANCBirthPlanCard({ enrollmentId, birthPlan }: ANCBirthPlanCardProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<BirthPlanData>({
    expected_delivery_mode: birthPlan.expected_delivery_mode || "",
    blood_donor_name: birthPlan.blood_donor_name || "",
    blood_donor_phone: birthPlan.blood_donor_phone || "",
    emergency_transport_plan: birthPlan.emergency_transport_plan || "",
  });

  const updateBirthPlan = useMutation({
    mutationFn: async (data: BirthPlanData) => {
      const { error } = await supabase
        .from("anc_enrollments")
        .update(data)
        .eq("id", enrollmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anc-enrollment"] });
      toast.success("Birth plan updated");
      setIsEditing(false);
    },
    onError: () => {
      toast.error("Failed to update birth plan");
    },
  });

  const handleSave = () => {
    updateBirthPlan.mutate(formData);
  };

  const hasAnyData = birthPlan.expected_delivery_mode || 
                     birthPlan.blood_donor_name || 
                     birthPlan.emergency_transport_plan;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            Birth Plan
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsEditing(!isEditing)}
            className="gap-1"
          >
            <Edit2 className="h-4 w-4" />
            {isEditing ? "Cancel" : "Edit"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            {/* Delivery Mode */}
            <div className="space-y-2">
              <Label htmlFor="delivery_mode">Expected Delivery Mode</Label>
              <Select
                value={formData.expected_delivery_mode || ""}
                onValueChange={(value) => setFormData(prev => ({ ...prev, expected_delivery_mode: value }))}
              >
                <SelectTrigger id="delivery_mode">
                  <SelectValue placeholder="Select delivery mode" />
                </SelectTrigger>
                <SelectContent>
                  {deliveryModes.map((mode) => (
                    <SelectItem key={mode.value} value={mode.value}>
                      {mode.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Blood Donor */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="donor_name" className="flex items-center gap-1">
                  <Droplets className="h-3 w-3 text-red-500" />
                  Blood Donor Name
                </Label>
                <Input
                  id="donor_name"
                  placeholder="Donor's full name"
                  value={formData.blood_donor_name || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, blood_donor_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="donor_phone">Donor Phone</Label>
                <Input
                  id="donor_phone"
                  placeholder="e.g., 0801234567"
                  value={formData.blood_donor_phone || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, blood_donor_phone: e.target.value }))}
                />
              </div>
            </div>

            {/* Emergency Transport */}
            <div className="space-y-2">
              <Label htmlFor="transport" className="flex items-center gap-1">
                <Car className="h-3 w-3 text-amber-500" />
                Emergency Transport Plan
              </Label>
              <Textarea
                id="transport"
                placeholder="Describe emergency transport arrangements (e.g., vehicle type, driver contact, distance to hospital)"
                value={formData.emergency_transport_plan || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, emergency_transport_plan: e.target.value }))}
                rows={3}
              />
            </div>

            <Button 
              onClick={handleSave} 
              disabled={updateBirthPlan.isPending}
              className="w-full gap-2"
            >
              <Save className="h-4 w-4" />
              Save Birth Plan
            </Button>
          </>
        ) : (
          <>
            {hasAnyData ? (
              <div className="space-y-4">
                {birthPlan.expected_delivery_mode && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Delivery Mode:</span>
                    <span className="font-medium">
                      {deliveryModes.find(m => m.value === birthPlan.expected_delivery_mode)?.label || birthPlan.expected_delivery_mode}
                    </span>
                  </div>
                )}
                
                {(birthPlan.blood_donor_name || birthPlan.blood_donor_phone) && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                      <Droplets className="h-4 w-4" />
                      <span className="font-medium text-sm">Blood Donor</span>
                    </div>
                    <p className="text-sm">
                      {birthPlan.blood_donor_name}
                      {birthPlan.blood_donor_phone && ` • ${birthPlan.blood_donor_phone}`}
                    </p>
                  </div>
                )}

                {birthPlan.emergency_transport_plan && (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                      <Car className="h-4 w-4" />
                      <span className="font-medium text-sm">Emergency Transport</span>
                    </div>
                    <p className="text-sm">{birthPlan.emergency_transport_plan}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No birth plan recorded yet. Click "Edit" to add details.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}