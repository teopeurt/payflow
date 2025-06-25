import { Home, FileText, ClipboardList, ShoppingCart, FileOutput, CreditCard, BarChart, Settings, User, LogOut, Users, Briefcase, FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarNavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
  onClick?: () => void;
}

const SidebarNavItem = ({ icon, label, href, isActive = false, onClick }: SidebarNavItemProps) => (
  <Link to={href} onClick={onClick}>
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
        isActive && "bg-sidebar-accent text-sidebar-foreground font-medium"
      )}
    >
      {icon}
      <span>{label}</span>
    </Button>
  </Link>
);

export function Sidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, signOut, isAdmin, isClient } = useAuth();

  return (
    <div className="h-screen w-64 bg-sidebar flex flex-col border-r">
      <div className="p-6">
        <h1 className="text-xl font-bold text-sidebar-foreground flex items-center">
          <span className="text-emerald mr-1">Pay</span>Flow
        </h1>
      </div>
      
      <div className="flex-1 px-3 py-2 space-y-1">
        <SidebarNavItem 
          icon={<Home size={18} />} 
          label="Dashboard" 
          href="/" 
          isActive={currentPath === "/"} 
        />
        
        {/* Show Documents link to everyone */}
        <SidebarNavItem 
          icon={<FileIcon size={18} />} 
          label="Documents" 
          href="/documents" 
          isActive={currentPath.startsWith("/documents")} 
        />
        
        {/* Client & Project Management - hide from clients */}
        {!isClient && (
          <>
            <SidebarNavItem 
              icon={<Users size={18} />} 
              label="Clients" 
              href="/clients" 
              isActive={currentPath.startsWith("/clients")} 
            />
            <SidebarNavItem 
              icon={<Briefcase size={18} />} 
              label="Projects" 
              href="/projects" 
              isActive={currentPath.startsWith("/projects")} 
            />
          </>
        )}
        
        {/* Hide financial tools from clients */}
        {!isClient && (
          <>
            <SidebarNavItem 
              icon={<FileText size={18} />} 
              label="Estimates" 
              href="/estimates" 
              isActive={currentPath.startsWith("/estimates")} 
            />
            <SidebarNavItem 
              icon={<ClipboardList size={18} />} 
              label="Quotes" 
              href="/quotes" 
              isActive={currentPath.startsWith("/quotes")} 
            />
            <SidebarNavItem 
              icon={<ShoppingCart size={18} />} 
              label="Purchase Orders" 
              href="/purchase-orders" 
              isActive={currentPath.startsWith("/purchase-orders")} 
            />
            <SidebarNavItem 
              icon={<FileOutput size={18} />} 
              label="Invoices" 
              href="/invoices" 
              isActive={currentPath.startsWith("/invoices")} 
            />
            <SidebarNavItem 
              icon={<CreditCard size={18} />} 
              label="Payments" 
              href="/payments" 
              isActive={currentPath.startsWith("/payments")} 
            />
            <SidebarNavItem 
              icon={<BarChart size={18} />} 
              label="Reports" 
              href="/reports" 
              isActive={currentPath.startsWith("/reports")} 
            />
          </>
        )}
      </div>
      
      <div className="px-3 py-4 mt-auto border-t border-sidebar-border">
        <SidebarNavItem 
          icon={<User size={18} />} 
          label="Profile" 
          href="/profile" 
          isActive={currentPath.startsWith("/profile")} 
        />
        {isAdmin && (
          <SidebarNavItem 
            icon={<Settings size={18} />} 
            label="Settings" 
            href="/settings" 
            isActive={currentPath.startsWith("/settings")} 
          />
        )}
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground mt-2"
          onClick={signOut}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}
