import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Settings as SettingsIcon, Building, Globe, CreditCard, FileText, Save, Loader2 } from "lucide-react";
import { format, addMonths } from "date-fns";

const CURRENCIES = [
  { symbol: "$", name: "US Dollar (USD)" },
  { symbol: "₦", name: "Nigerian Naira (NGN)" },
  { symbol: "£", name: "British Pound (GBP)" },
  { symbol: "€", name: "Euro (EUR)" },
  { symbol: "₹", name: "Indian Rupee (INR)" },
  { symbol: "¥", name: "Japanese Yen (JPY)" },
  { symbol: "C$", name: "Canadian Dollar (CAD)" },
  { symbol: "A$", name: "Australian Dollar (AUD)" },
];

const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Africa/Lagos", label: "West Africa Time (WAT)" },
  { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
];

const Settings = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contact_phone: "",
    support_email: "",
    currency_symbol: "$",
    timezone: "UTC",
  });

  // Fetch organization data
  const { data: organization, isLoading } = useQuery({
    queryKey: ["organization-settings", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return null;
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", profile.organization_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  // Update form when organization loads
  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || "",
        address: organization.address || "",
        contact_phone: organization.contact_phone || "",
        support_email: organization.support_email || "",
        currency_symbol: organization.currency_symbol || "$",
        timezone: organization.timezone || "UTC",
      });
    }
  }, [organization]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.organization_id) throw new Error("No organization");
      
      const { error } = await supabase
        .from("organizations")
        .update({
          name: formData.name,
          address: formData.address || null,
          contact_phone: formData.contact_phone || null,
          support_email: formData.support_email || null,
          currency_symbol: formData.currency_symbol,
          timezone: formData.timezone,
        })
        .eq("id", profile.organization_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      queryClient.invalidateQueries({ queryKey: ["organization-settings"] });
      toast.success("Settings saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save settings: " + error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const nextBillingDate = addMonths(new Date(), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <SettingsIcon className="h-8 w-8 text-primary" />
          Hospital Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your hospital profile, preferences, and billing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Settings Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Organization Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Organization Profile
              </CardTitle>
              <CardDescription>
                These details will appear on receipts and official documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Hospital Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="City General Hospital"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Medical Center Drive&#10;City, State 12345"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Contact Phone</Label>
                  <Input
                    id="phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Support Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.support_email}
                    onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                    placeholder="support@hospital.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Localization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Localization & Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={formData.currency_symbol}
                    onValueChange={(value) => setFormData({ ...formData, currency_symbol: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency.symbol} value={currency.symbol}>
                          {currency.symbol} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Enterprise Tier</span>
                    <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Unlimited users, priority support, advanced analytics
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Next billing date</p>
                  <p className="font-semibold">{format(nextBillingDate, "MMM d, yyyy")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {/* Right Side - Receipt Preview */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Receipt Preview
              </CardTitle>
              <CardDescription>
                Live preview of your payment receipts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-background shadow-sm space-y-4">
                {/* Receipt Header */}
                <div className="text-center border-b pb-4">
                  <h3 className="font-bold text-lg">
                    {formData.name || "Hospital Name"}
                  </h3>
                  <p className="text-xs text-muted-foreground whitespace-pre-line">
                    {formData.address || "Address not set"}
                  </p>
                  {formData.contact_phone && (
                    <p className="text-xs text-muted-foreground">
                      Tel: {formData.contact_phone}
                    </p>
                  )}
                  {formData.support_email && (
                    <p className="text-xs text-muted-foreground">
                      {formData.support_email}
                    </p>
                  )}
                </div>

                {/* Receipt Body */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Receipt #:</span>
                    <span>INV-00001</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{format(new Date(), "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Patient:</span>
                    <span>John Doe</span>
                  </div>
                </div>

                <Separator />

                {/* Sample Items */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Consultation Fee</span>
                    <span>{formData.currency_symbol}5,000.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paracetamol x2</span>
                    <span>{formData.currency_symbol}500.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amoxicillin x1</span>
                    <span>{formData.currency_symbol}1,200.00</span>
                  </div>
                </div>

                <Separator />

                {/* Total */}
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formData.currency_symbol}6,700.00</span>
                </div>

                {/* Footer */}
                <div className="text-center pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Thank you for choosing {formData.name || "our hospital"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Get well soon!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
