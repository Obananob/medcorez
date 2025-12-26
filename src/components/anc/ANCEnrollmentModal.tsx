import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Baby, Calendar, Heart } from "lucide-react";
import { useOrganization } from "@/hooks/useOrganization";
import {
  calculateEDD,
  calculateGestationalAge,
  formatGestationalAge,
  getTrimester,
  bloodGroupOptions,
  genotypeOptions,
  hivStatusOptions,
} from "@/utils/ancUtils";

interface ANCEnrollmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
}

export function ANCEnrollmentModal({
  open,
  onOpenChange,
  patientId,
  patientName,
}: ANCEnrollmentModalProps) {
  const queryClient = useQueryClient();
  const { organization } = useOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    lmp: "",
    gravida: "1",
    para: "0",
    blood_group: "",
    genotype: "",
    hiv_status: "",
  });

  // Calculated values
  const [edd, setEdd] = useState<Date | null>(null);
  const [gestationalAge, setGestationalAge] = useState<{ weeks: number; days: number } | null>(null);

  useEffect(() => {
    if (formData.lmp) {
      const lmpDate = new Date(formData.lmp);
      const calculatedEdd = calculateEDD(lmpDate);
      const ga = calculateGestationalAge(lmpDate);
      setEdd(calculatedEdd);
      setGestationalAge(ga);
    } else {
      setEdd(null);
      setGestationalAge(null);
    }
  }, [formData.lmp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization?.id || !formData.lmp) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const lmpDate = new Date(formData.lmp);
      const calculatedEdd = calculateEDD(lmpDate);

      const { error } = await supabase.from("anc_enrollments").insert({
        organization_id: organization.id,
        patient_id: patientId,
        lmp: formData.lmp,
        edd: format(calculatedEdd, "yyyy-MM-dd"),
        gravida: parseInt(formData.gravida) || 1,
        para: parseInt(formData.para) || 0,
        blood_group: formData.blood_group || null,
        genotype: formData.genotype || null,
        hiv_status: formData.hiv_status || null,
      });

      if (error) throw error;

      toast.success("Patient enrolled in ANC successfully");
      queryClient.invalidateQueries({ queryKey: ["anc-enrollment", patientId] });
      onOpenChange(false);
      setFormData({
        lmp: "",
        gravida: "1",
        para: "0",
        blood_group: "",
        genotype: "",
        hiv_status: "",
      });
    } catch (error: any) {
      console.error("Error enrolling patient:", error);
      if (error.code === "23505") {
        toast.error("Patient already has an active ANC enrollment with this LMP");
      } else {
        toast.error("Failed to enroll patient in ANC");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const trimester = gestationalAge ? getTrimester(gestationalAge.weeks) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5 text-pink-500" />
            Enroll in Antenatal Care
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enrolling: <span className="font-medium text-foreground">{patientName}</span>
          </p>

          {/* LMP and Calculated Values */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="lmp" className="text-sm font-medium">
                Last Menstrual Period (LMP) *
              </Label>
              <Input
                id="lmp"
                type="date"
                value={formData.lmp}
                onChange={(e) => setFormData({ ...formData, lmp: e.target.value })}
                max={format(new Date(), "yyyy-MM-dd")}
                required
              />
            </div>

            {edd && gestationalAge && (
              <Card className="bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-pink-600" />
                      <span className="text-sm text-muted-foreground">EDD:</span>
                    </div>
                    <span className="font-semibold text-pink-700 dark:text-pink-300">
                      {format(edd, "MMMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-pink-600" />
                      <span className="text-sm text-muted-foreground">Gestational Age:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-pink-700 dark:text-pink-300">
                        {formatGestationalAge(gestationalAge.weeks, gestationalAge.days)}
                      </span>
                      {trimester && (
                        <Badge variant="outline" className="text-xs">
                          {trimester.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Obstetric History */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gravida" className="text-sm font-medium">
                Gravida
              </Label>
              <Input
                id="gravida"
                type="number"
                min="1"
                value={formData.gravida}
                onChange={(e) => setFormData({ ...formData, gravida: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">Total pregnancies</p>
            </div>
            <div>
              <Label htmlFor="para" className="text-sm font-medium">
                Para
              </Label>
              <Input
                id="para"
                type="number"
                min="0"
                value={formData.para}
                onChange={(e) => setFormData({ ...formData, para: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">Viable births</p>
            </div>
          </div>

          {/* Blood Type Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="blood_group" className="text-sm font-medium">
                Blood Group
              </Label>
              <Select
                value={formData.blood_group}
                onValueChange={(value) => setFormData({ ...formData, blood_group: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {bloodGroupOptions.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="genotype" className="text-sm font-medium">
                Genotype
              </Label>
              <Select
                value={formData.genotype}
                onValueChange={(value) => setFormData({ ...formData, genotype: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {genotypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* HIV Status */}
          <div>
            <Label htmlFor="hiv_status" className="text-sm font-medium">
              HIV Status
            </Label>
            <Select
              value={formData.hiv_status}
              onValueChange={(value) => setFormData({ ...formData, hiv_status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {hivStatusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.lmp}>
              {isSubmitting ? "Enrolling..." : "Enroll Patient"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
