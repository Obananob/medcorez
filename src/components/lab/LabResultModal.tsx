import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, FlaskConical } from "lucide-react";

interface LabRequest {
  id: string;
  test_name: string;
  category: string;
  patients?: {
    first_name: string;
    last_name: string;
    medical_record_number: string;
  };
}

interface LabResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labRequest: LabRequest | null;
}

export function LabResultModal({ open, onOpenChange, labRequest }: LabResultModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [findings, setFindings] = useState("");
  const [referenceRange, setReferenceRange] = useState("");

  const saveResultMutation = useMutation({
    mutationFn: async () => {
      if (!labRequest) throw new Error("No lab request selected");

      const { error } = await supabase
        .from("lab_requests")
        .update({
          findings,
          reference_range: referenceRange,
          status: "completed",
          completed_at: new Date().toISOString(),
          completed_by: user?.id,
        })
        .eq("id", labRequest.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-requests"] });
      queryClient.invalidateQueries({ queryKey: ["lab-stats"] });
      queryClient.invalidateQueries({ queryKey: ["lab-recent-pending"] });
      toast.success("Lab result saved successfully");
      onOpenChange(false);
      setFindings("");
      setReferenceRange("");
    },
    onError: (error) => {
      toast.error("Failed to save result: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!findings.trim()) {
      toast.error("Please enter the findings");
      return;
    }
    saveResultMutation.mutate();
  };

  if (!labRequest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Enter Lab Result
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient & Test Info */}
          <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Patient</span>
              <span className="font-medium">
                {labRequest.patients?.first_name} {labRequest.patients?.last_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">MRN</span>
              <span className="font-medium">{labRequest.patients?.medical_record_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Test</span>
              <span className="font-medium">{labRequest.test_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Category</span>
              <span className="font-medium">{labRequest.category}</span>
            </div>
          </div>

          {/* Findings */}
          <div className="space-y-2">
            <Label htmlFor="findings">Findings *</Label>
            <Textarea
              id="findings"
              placeholder="Enter test results and observations..."
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              rows={5}
              required
            />
          </div>

          {/* Reference Range */}
          <div className="space-y-2">
            <Label htmlFor="referenceRange">Reference Range</Label>
            <Input
              id="referenceRange"
              placeholder="e.g., 70-100 mg/dL, Negative, 4.5-11.0 x10^9/L"
              value={referenceRange}
              onChange={(e) => setReferenceRange(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saveResultMutation.isPending}>
              {saveResultMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save Result
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
