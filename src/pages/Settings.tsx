import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { usePlan } from "@/hooks/usePlan";
import { UpgradeModal } from "@/components/plan/UpgradeModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Settings as SettingsIcon, 
  Building, 
  Globe, 
  Save, 
  Loader2, 
  Camera, 
  ImageIcon, 
  Moon, 
  Sun,
  Crown,
  Users,
  Sparkles,
  Check,
  BarChart3,
  Wallet,
  Package,
  AlertTriangle
} from "lucide-react";
import { invalidatePlanCache } from "@/hooks/usePlan";

const COUNTRIES = [
  { code: "US", name: "United States", currency: "$" },
  { code: "NG", name: "Nigeria", currency: "₦" },
  { code: "GB", name: "United Kingdom", currency: "£" },
  { code: "EU", name: "European Union", currency: "€" },
  { code: "IN", name: "India", currency: "₹" },
  { code: "JP", name: "Japan", currency: "¥" },
  { code: "CA", name: "Canada", currency: "C$" },
  { code: "AU", name: "Australia", currency: "A$" },
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
  const { theme, setTheme } = useTheme();
  const { plan, isPremium, isFreemium, patientCount, patientLimit, remainingPatients, isLoading: planLoading } = usePlan();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contact_phone: "",
    support_email: "",
    country: "US",
    currency_symbol: "$",
    timezone: "UTC",
    logo_url: "",
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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
      const country = COUNTRIES.find(c => c.currency === organization.currency_symbol) || COUNTRIES[0];
      setFormData({
        name: organization.name || "",
        address: organization.address || "",
        contact_phone: organization.contact_phone || "",
        support_email: organization.support_email || "",
        country: country.code,
        currency_symbol: organization.currency_symbol || "$",
        timezone: organization.timezone || "UTC",
        logo_url: organization.logo_url || "",
      });
    }
  }, [organization]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.organization_id) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${profile.organization_id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("organization-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("organization-logos")
        .getPublicUrl(filePath);

      const logoUrlWithCache = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("organizations")
        .update({ logo_url: logoUrlWithCache })
        .eq("id", profile.organization_id);

      if (updateError) throw updateError;

      setFormData(prev => ({ ...prev, logo_url: logoUrlWithCache }));
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      queryClient.invalidateQueries({ queryKey: ["organization-settings"] });
      toast.success("Logo uploaded successfully");
    } catch (error: any) {
      toast.error("Failed to upload logo: " + error.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCountryChange = (countryCode: string) => {
    const country = COUNTRIES.find(c => c.code === countryCode);
    if (country) {
      setFormData({
        ...formData,
        country: countryCode,
        currency_symbol: country.currency,
      });
    }
  };

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

      <div className="space-y-6 max-w-4xl">
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
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Hospital Logo</Label>
                <div className="flex items-center gap-4">
                  <div 
                    className="relative w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/50 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {formData.logo_url ? (
                      <img 
                        src={formData.logo_url} 
                        alt="Hospital Logo" 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                    {uploadingLogo && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1 p-1.5 bg-primary rounded-full">
                      <Camera className="h-3 w-3 text-primary-foreground" />
                    </div>
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <div className="text-sm text-muted-foreground">
                    <p>Click to upload your hospital logo</p>
                    <p>PNG, JPG up to 2MB</p>
                  </div>
                </div>
              </div>

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select
                    value={formData.country}
                    onValueChange={handleCountryChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name} ({country.currency})
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
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Currency:</span> {formData.currency_symbol} (based on selected country)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription & Plan */}
          <Card className={isPremium ? "border-amber-500/50" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Crown className={`h-5 w-5 ${isPremium ? "text-amber-500" : "text-muted-foreground"}`} />
                  Subscription & Plan
                </CardTitle>
                <Badge 
                  variant={isPremium ? "default" : "secondary"}
                  className={isPremium ? "bg-gradient-to-r from-amber-500 to-amber-600" : ""}
                >
                  {isPremium ? "Premium" : "Free Plan"}
                </Badge>
              </div>
              <CardDescription>
                Manage your subscription and view usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Plan Status */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Patient Records</p>
                      <p className="text-sm text-muted-foreground">
                        {isPremium 
                          ? "Unlimited patients" 
                          : `${patientCount} of ${patientLimit} used`}
                      </p>
                    </div>
                  </div>
                  {isFreemium && (
                    <span className="text-sm font-medium text-muted-foreground">
                      {remainingPatients} remaining
                    </span>
                  )}
                </div>

                {isFreemium && (
                  <Progress 
                    value={(patientCount / patientLimit) * 100} 
                    className="h-2"
                  />
                )}
              </div>

              {/* Premium Features List */}
              {isFreemium && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Upgrade to Premium to unlock:
                  </p>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-background">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm">Unlimited patient records</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-background">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      <span className="text-sm">Analytics dashboard</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-background">
                      <Wallet className="h-4 w-4 text-primary" />
                      <span className="text-sm">Finance & billing management</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-background">
                      <Package className="h-4 w-4 text-primary" />
                      <span className="text-sm">Advanced inventory tracking</span>
                    </div>
                  </div>

                  <Button className="w-full gap-2 mt-4" onClick={() => setShowUpgradeModal(true)}>
                    <Sparkles className="h-4 w-4" />
                    Upgrade to Premium
                  </Button>
                </div>
              )}

              {/* Premium Status */}
              {isPremium && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <Check className="h-4 w-4" />
                    <span>All premium features unlocked</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3 w-3" />
                      Unlimited patients
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3 w-3" />
                      Analytics dashboard
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3 w-3" />
                      Finance management
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3 w-3" />
                      Advanced inventory
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                Appearance
              </CardTitle>
              <CardDescription>
                Customize how MedCore looks on your device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-3">
                  {theme === "dark" ? (
                    <Moon className="h-5 w-5 text-primary" />
                  ) : (
                    <Sun className="h-5 w-5 text-primary" />
                  )}
                  <div>
                    <p className="font-medium text-foreground">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">
                      {theme === "dark" ? "Currently using dark theme" : "Currently using light theme"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
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

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        reason="premium_feature"
        featureName="Premium Plan"
      />
    </div>
  );
};

export default Settings;
