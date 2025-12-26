import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Stethoscope, 
  Package, 
  DollarSign,
  Cross,
  LogOut,
  Settings,
  Pill,
  Download,
  FlaskConical
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePWAInstall } from "@/hooks/usePWAInstall";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const allMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["admin", "doctor", "nurse", "lab_scientist"] },
  { title: "Patients", url: "/patients", icon: Users, roles: ["admin", "doctor", "nurse", "receptionist"] },
  { title: "Appointments", url: "/appointments", icon: Calendar, roles: ["admin", "receptionist"] },
  { title: "My Consultations", url: "/appointments", icon: Calendar, roles: ["doctor"] },
  { title: "Triage", url: "/appointments", icon: Calendar, roles: ["nurse"] },
  { title: "Lab Workspace", url: "/lab-workspace", icon: FlaskConical, roles: ["admin", "lab_scientist"] },
  { title: "Staff", url: "/staff", icon: Stethoscope, roles: ["admin"] },
  { title: "Inventory", url: "/inventory", icon: Package, roles: ["admin", "pharmacist"] },
  { title: "Finance", url: "/finance", icon: DollarSign, roles: ["admin"] },
  { title: "Pharmacy", url: "/finance", icon: Pill, roles: ["pharmacist"] },
  { title: "Settings", url: "/settings", icon: Settings, roles: ["admin"] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { isInstallable, installApp } = usePWAInstall();
  const currentPath = location.pathname;

  // Filter menu items based on user role
  const userRole = profile?.role || "receptionist"; // Default to receptionist if no role
  const menuItems = allMenuItems.filter((item) => item.roles.includes(userRole));

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  // Get display name
  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return user?.email?.split("@")[0] || "User";
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Logo */}
        <div className="p-4 flex items-center gap-2">
          <Cross className="h-6 w-6 text-primary" strokeWidth={2.5} />
          {state === "expanded" && (
            <span className="text-xl font-bold text-foreground">MedCore</span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-muted/50"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {state === "expanded" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with User Profile */}
      <SidebarFooter className="p-4 border-t">
        {state === "expanded" ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || ""}
                </p>
              </div>
            </div>
            {isInstallable && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={installApp}
              >
                <Download className="h-4 w-4 mr-2" />
                Install App
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {isInstallable && (
              <Button
                variant="outline"
                size="icon"
                className="w-full"
                onClick={installApp}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="destructive"
              size="icon"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
