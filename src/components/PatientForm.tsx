import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AvatarUpload } from "@/components/AvatarUpload";

export interface PatientFormData {
  first_name: string;
  last_name: string;
  dob: string;
  gender: string;
  phone: string;
  emergency_contact: string;
  allergies: string;
  avatar_url: string;
}

interface PatientFormProps {
  formData: PatientFormData;
  setFormData: React.Dispatch<React.SetStateAction<PatientFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isLoading: boolean;
  submitLabel: string;
}

export function PatientForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel,
}: PatientFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-4">
      <AvatarUpload
        currentUrl={formData.avatar_url}
        onUpload={(url) => setFormData((prev) => ({ ...prev, avatar_url: url }))}
        folder="patients"
        name={`${formData.first_name} ${formData.last_name}`}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="patient_first_name">First Name *</Label>
          <Input
            id="patient_first_name"
            value={formData.first_name}
            onChange={(e) => setFormData((prev) => ({ ...prev, first_name: e.target.value }))}
            placeholder="John"
            required
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="patient_last_name">Last Name *</Label>
          <Input
            id="patient_last_name"
            value={formData.last_name}
            onChange={(e) => setFormData((prev) => ({ ...prev, last_name: e.target.value }))}
            placeholder="Doe"
            required
            autoComplete="off"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="patient_dob">Date of Birth</Label>
          <Input
            id="patient_dob"
            type="date"
            value={formData.dob}
            onChange={(e) => setFormData((prev) => ({ ...prev, dob: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="patient_gender">Gender</Label>
          <Select
            value={formData.gender}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value }))}
          >
            <SelectTrigger id="patient_gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="patient_phone">Phone</Label>
        <Input
          id="patient_phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
          placeholder="+1 (555) 000-0000"
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="patient_emergency">Emergency Contact</Label>
        <Input
          id="patient_emergency"
          value={formData.emergency_contact}
          onChange={(e) => setFormData((prev) => ({ ...prev, emergency_contact: e.target.value }))}
          placeholder="Name - Phone number"
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="patient_allergies">Allergies</Label>
        <Input
          id="patient_allergies"
          value={formData.allergies}
          onChange={(e) => setFormData((prev) => ({ ...prev, allergies: e.target.value }))}
          placeholder="Penicillin, Peanuts, etc."
          autoComplete="off"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
