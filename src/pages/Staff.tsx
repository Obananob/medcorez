import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Plus, Search, UserPlus, MoreHorizontal, Pencil, Trash2, Copy, Check, Download, KeyRound } from "lucide-react";
import { useOrganization } from "@/hooks/useOrganization";
import { generateLoginSlip } from "@/utils/generateLoginSlip";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { AvatarUpload } from "@/components/AvatarUpload";

const ROLES = [
  { value: "doctor", label: "Doctor" },
  { value: "nurse", label: "Nurse" },
  { value: "admin", label: "Admin" },
  { value: "receptionist", label: "Receptionist" },
  { value: "pharmacist", label: "Pharmacist" },
];

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  organization_id: string;
  user_id: string | null;
}

interface CreatedCredentials {
  email: string;
  password: string;
  name: string;
}

// Generate random password like MedCore-X9
const generatePassword = (): string => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "MedCore-";
  for (let i = 0; i < 4; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const Staff = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { organization } = useOrganization();
  const isAdmin = profile?.role === "admin";
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<CreatedCredentials | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [deleteStaff, setDeleteStaff] = useState<StaffMember | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [resetPasswordStaff, setResetPasswordStaff] = useState<StaffMember | null>(null);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [generatedNewPassword, setGeneratedNewPassword] = useState("");
  const [copiedNewPassword, setCopiedNewPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    role: "",
    email: "",
    phone: "",
    avatar_url: "",
  });

  // Fetch staff members
  const { data: staffMembers, isLoading } = useQuery({
    queryKey: ["staff-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as StaffMember[];
    },
  });

  // Create staff mutation (automated flow)
  const createStaffMutation = useMutation({
    mutationFn: async (staffData: typeof formData) => {
      if (!profile?.organization_id) throw new Error("No organization found");
      
      const password = generatePassword();
      
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email: staffData.email,
          password,
          first_name: staffData.first_name,
          last_name: staffData.last_name,
          role: staffData.role,
          organization_id: profile.organization_id,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return { 
        ...data, 
        credentials: { 
          email: staffData.email, 
          password,
          name: `${staffData.first_name} ${staffData.last_name}`
        } 
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-staff-count"] });
      setIsAddDialogOpen(false);
      setCreatedCredentials(data.credentials);
      setIsCredentialsDialogOpen(true);
      resetForm();
    },
    onError: (error) => {
      if (error.message.includes("already been registered")) {
        toast.error("This email is already in use. Please use a different email address.");
      } else {
        toast.error("Failed to create staff: " + error.message);
      }
    },
  });

  // Update staff mutation
  const updateStaffMutation = useMutation({
    mutationFn: async ({ id, ...staffData }: { id: string } & typeof formData) => {
      const { data, error } = await supabase
        .from("staff")
        .update({
          first_name: staffData.first_name,
          last_name: staffData.last_name,
          role: staffData.role,
          email: staffData.email || null,
          phone: staffData.phone || null,
          avatar_url: staffData.avatar_url || null,
        })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      toast.success("Staff updated successfully");
      setIsEditDialogOpen(false);
      setEditingStaff(null);
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to update staff: " + error.message);
    },
  });

  // Delete staff mutation
  const deleteStaffMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("staff")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-staff-count"] });
      toast.success("Staff member deleted");
      setDeleteStaff(null);
    },
    onError: (error) => {
      toast.error("Failed to delete staff: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({ first_name: "", last_name: "", role: "", email: "", phone: "", avatar_url: "" });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.role || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }
    createStaffMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !formData.first_name || !formData.last_name || !formData.role) {
      toast.error("Please fill in all required fields");
      return;
    }
    updateStaffMutation.mutate({ id: editingStaff.id, ...formData });
  };

  const openEditDialog = (staff: StaffMember) => {
    setEditingStaff(staff);
    setFormData({
      first_name: staff.first_name,
      last_name: staff.last_name,
      role: staff.role,
      email: staff.email || "",
      phone: staff.phone || "",
      avatar_url: staff.avatar_url || "",
    });
    setIsEditDialogOpen(true);
  };

  const copyPassword = async () => {
    if (createdCredentials?.password) {
      await navigator.clipboard.writeText(createdCredentials.password);
      setCopiedPassword(true);
      toast.success("Password copied to clipboard");
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  const filteredStaff = staffMembers?.filter((staff) => {
    const fullName = `${staff.first_name} ${staff.last_name}`.toLowerCase();
    const email = staff.email?.toLowerCase() || "";
    const role = staff.role?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search) || role.includes(search);
  });

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case "doctor": return "default";
      case "nurse": return "secondary";
      case "admin": return "destructive";
      case "receptionist": return "outline";
      default: return "secondary";
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
          <p className="text-muted-foreground mt-1">Manage your hospital staff members</p>
        </div>
        {isAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Add New Staff Member
                </DialogTitle>
                <DialogDescription>
                  Create a new staff account. Login credentials will be generated automatically.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <AvatarUpload
                  currentUrl={formData.avatar_url}
                  onUpload={(url) => setFormData({ ...formData, avatar_url: url })}
                  folder="staff"
                  name={`${formData.first_name} ${formData.last_name}`}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john.doe@hospital.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 234 567 890"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createStaffMutation.isPending}>
                    {createStaffMutation.isPending ? "Creating..." : "Add Staff"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Success Credentials Dialog */}
      <Dialog open={isCredentialsDialogOpen} onOpenChange={setIsCredentialsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              Staff Member Created Successfully
            </DialogTitle>
            <DialogDescription>
              Please share these credentials with {createdCredentials?.name}:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Email</Label>
              <div className="p-3 bg-muted rounded-md font-mono text-sm">
                {createdCredentials?.email}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Password</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm">
                  {createdCredentials?.password}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyPassword}
                >
                  {copiedPassword ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              The staff member can use these credentials to log in. They should change their password after first login.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (createdCredentials) {
                  generateLoginSlip({
                    hospitalName: organization?.name || "Hospital",
                    staffName: createdCredentials.name,
                    role: formData.role ? ROLES.find(r => r.value === formData.role)?.label || formData.role : "Staff",
                    email: createdCredentials.email,
                    temporaryPassword: createdCredentials.password,
                  });
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Login Slip
            </Button>
            <Button onClick={() => {
              setIsCredentialsDialogOpen(false);
              setCreatedCredentials(null);
            }}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search staff..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Staff Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  {isAdmin && <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>}
                </TableRow>
              ))
            ) : filteredStaff?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-8 text-muted-foreground">
                  No staff members found
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff?.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={staff.avatar_url || undefined} />
                        <AvatarFallback>{getInitials(staff.first_name, staff.last_name)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{staff.first_name} {staff.last_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(staff.role)}>
                      {staff.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {staff.email && <div>{staff.email}</div>}
                      {staff.phone && <div className="text-muted-foreground">{staff.phone}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={staff.is_active ? "default" : "secondary"}>
                      {staff.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(staff.created_at), "MMM d, yyyy")}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(staff)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeleteStaff(staff)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <AvatarUpload
              currentUrl={formData.avatar_url}
              onUpload={(url) => setFormData({ ...formData, avatar_url: url })}
              folder="staff"
              name={`${formData.first_name} ${formData.last_name}`}
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_first_name">First Name *</Label>
                <Input
                  id="edit_first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_last_name">Last Name *</Label>
                <Input
                  id="edit_last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_phone">Phone</Label>
              <Input
                id="edit_phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateStaffMutation.isPending}>
                {updateStaffMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteStaff} onOpenChange={() => setDeleteStaff(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteStaff?.first_name} {deleteStaff?.last_name}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteStaff && deleteStaffMutation.mutate(deleteStaff.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteStaffMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Staff;
