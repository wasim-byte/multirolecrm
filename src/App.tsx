import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthService, UserRole } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FounderDashboard } from "@/components/dashboards/FounderDashboard";
import { ManagerDashboard } from "@/components/dashboards/ManagerDashboard";
import { DeveloperDashboard } from "@/components/dashboards/DeveloperDashboard";
import { ClientDashboard } from "@/components/dashboards/ClientDashboard";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      setIsAuthenticated(true);
      setUserRole(currentUser.role);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (role: UserRole) => {
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
  };

  const renderDashboard = () => {
    switch (userRole) {
      case 'founder':
        return <FounderDashboard />;
      case 'manager':
        return <ManagerDashboard />;
      case 'developer':
        return <DeveloperDashboard />;
      case 'client':
        return <ClientDashboard />;
      default:
        return <div>Invalid role</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <div className="min-h-screen bg-background">
          {!isAuthenticated ? (
            <LoginForm onLogin={handleLogin} />
          ) : (
            <DashboardLayout onLogout={handleLogout}>
              {renderDashboard()}
            </DashboardLayout>
          )}
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
