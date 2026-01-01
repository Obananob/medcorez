import { useState } from "react";
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
  FlaskConical,
  Crown
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { usePlan, PremiumFeature } from "@/hooks/usePlan";
import { UpgradeModal } from "@/components/plan/UpgradeModal";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  premiumFeature?: PremiumFeature;
}

const allMenuItems: MenuItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["admin", "doctor", "nurse", "lab_scientist"] },
  { title: "Patients", url: "/patients", icon: Users, roles: ["admin", "doctor", "nurse", "receptionist"] },
  { title: "Appointments", url: "/appointments", icon: Calendar, roles: ["admin", "receptionist"] },
  { title: "My Consultations", url: "/appointments", icon: Calendar, roles: ["doctor"] },
  { title: "Triage", url: "/appointments", icon: Calendar, roles: ["nurse"] },
  { title: "Lab Workspace", url: "/lab-workspace", icon: FlaskConical, roles: ["admin", "lab_scientist"] },
  { title: "Staff", url: "/staff", icon: Stethoscope, roles: ["admin"] },
  { title: "Inventory", url: "/inventory", icon: Package, roles: ["admin", "pharmacist"], premiumFeature: "advanced_inventory" },
  { title: "Finance", url: "/finance", icon: DollarSign, roles: ["admin"], premiumFeature: "finance" },
  { title: "Pharmacy", url: "/finance", icon: Pill, roles: ["pharmacist"] },
  { title: "Settings", url: "/settings", icon: Settings, roles: ["admin"] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { isInstallable, installApp } = usePWAInstall();
  const { isPremium, isAdmin, hasFeatureAccess } = usePlan();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState<string>("");
  const currentPath = location.pathname;

  // Filter menu items based on user role
  const userRole = profile?.role || "receptionist"; // Default to receptionist if no role
  const menuItems = allMenuItems.filter((item) => item.roles.includes(userRole));

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const handlePremiumClick = (item: MenuItem, e: React.MouseEvent) => {
    if (item.premiumFeature && !hasFeatureAccess(item.premiumFeature)) {
      e.preventDefault();
      if (isAdmin) {
        setBlockedFeature(item.title);
        setShowUpgradeModal(true);
      }
      // Non-admins can still see the menu item but will get blocked at the page level
    }
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

  const renderMenuItem = (item: MenuItem) => {
    const isPremiumLocked = item.premiumFeature && !hasFeatureAccess(item.premiumFeature);

    const menuContent = (
      <NavLink
        to={item.url}
        end
        className={`hover:bg-muted/50 ${isPremiumLocked ? "opacity-60" : ""}`}
        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
        onClick={(e) => handlePremiumClick(item, e)}
      >
        <item.icon className="h-4 w-4" />
        {state === "expanded" && (
          <span className="flex items-center gap-2">
            {item.title}
            {isPremiumLocked && <Crown className="h-3 w-3 text-amber-500" />}
          </span>
        )}
      </NavLink>
    );

    if (isPremiumLocked && !isAdmin) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {menuContent}
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Premium feature — contact Admin</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return menuContent;
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
                    {renderMenuItem(item)}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        reason="premium_feature"
        featureName={blockedFeature}
      />

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
