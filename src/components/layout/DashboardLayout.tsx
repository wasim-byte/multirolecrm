import { useState, useEffect } from "react";
import { AuthService, UserRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  LogOut, 
  User, 
  Settings, 
  Crown, 
  Shield, 
  Code, 
  Users,
  Menu,
  X
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

const roleIcons: Record<UserRole, any> = {
  founder: Crown,
  manager: Shield,
  developer: Code,
  client: Users
};

const roleColors: Record<UserRole, string> = {
  founder: "bg-gradient-to-r from-yellow-500 to-orange-500",
  manager: "bg-gradient-to-r from-blue-500 to-purple-500", 
  developer: "bg-gradient-to-r from-green-500 to-teal-500",
  client: "bg-gradient-to-r from-purple-500 to-pink-500"
};

export function DashboardLayout({ children, onLogout }: DashboardLayoutProps) {
  const [user, setUser] = useState(AuthService.getCurrentUser());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    setUser(currentUser);
  }, []);

  if (!user) {
    onLogout();
    return null;
  }

  const RoleIcon = roleIcons[user.role];

  const handleLogout = () => {
    AuthService.logout();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="mr-2 md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>

          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg gradient-text">Night Owl CRM</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={`${roleColors[user.role]} text-white`}>
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 glass-card border-border/50" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <div className="flex items-center space-x-2">
                    <RoleIcon className="h-3 w-3" />
                    <Badge variant="secondary" className="text-xs">
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  </div>
                  {user.email && (
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}