
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@payflow/core/auth";
import { dbQueries } from "@/lib/database/queries";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export function Header() {
  const { profile, signOut } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (profile?.id) {
        try {
          const role = await dbQueries.getUserRole(profile.id);
          setUserRole(role);
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      }
    };

    fetchUserRole();
  }, [profile]);
  
  // Function to get the user's initials for the avatar fallback
  const getUserInitials = () => {
    if (!profile) return "U";
    const firstName = profile.first_name || "";
    const lastName = profile.last_name || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };
  
  // Get display name
  const displayName = profile 
    ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() 
    : "User";
  
  // Get role for display
  const roleDisplayName = userRole === 'admin' ? 'Administrator' : 
                         userRole === 'team_member' ? 'Team Member' : 
                         userRole === 'client' ? 'Client' : 'User';

  return (
    <header className="border-b bg-white dark:bg-card px-6 py-3 flex items-center justify-between">
      <div className="flex-1 flex items-center">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search..." 
            className="pl-10 bg-background" 
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto">
              <DropdownMenuItem className="p-3 cursor-pointer">
                <div>
                  <p className="font-medium">New quote approval request</p>
                  <p className="text-sm text-muted-foreground">Client: Acme Inc. - $5,400</p>
                  <p className="text-xs text-muted-foreground mt-1">2 minutes ago</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="p-3 cursor-pointer">
                <div>
                  <p className="font-medium">Purchase order received</p>
                  <p className="text-sm text-muted-foreground">From: TechNova - #PO-2023-42</p>
                  <p className="text-xs text-muted-foreground mt-1">1 hour ago</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="p-3 cursor-pointer">
                <div>
                  <p className="font-medium">Invoice payment received</p>
                  <p className="text-sm text-muted-foreground">Invoice #INV-2023-91 - $3,250</p>
                  <p className="text-xs text-muted-foreground mt-1">Yesterday at 15:30</p>
                </div>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center cursor-pointer font-medium text-sm text-primary">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" alt={displayName} />
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-sm font-medium text-left">
                {displayName}
                <div className="text-xs font-normal text-muted-foreground">{roleDisplayName}</div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
