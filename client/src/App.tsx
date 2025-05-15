import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/Layout";
import AdminLayout from "@/components/layout/AdminLayout";
import EmployeeLayout from "@/components/layout/EmployeeLayout";
import Dashboard from "@/pages/Dashboard";
import EmployeeDashboard from "@/pages/employee/EmployeeDashboard";
import Employees from "@/pages/Employees";
import Companies from "@/pages/Companies";
import DTRManagement from "@/pages/DTRManagement";
import EmployeeDTR from "@/pages/employee/EmployeeDTR";
import Payroll from "@/pages/Payroll";
import EmployeePayroll from "@/pages/employee/EmployeePayroll";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import AuthPage from "@/pages/auth-page";
import Onboarding from "@/pages/Onboarding";
import Profile from "@/pages/Profile";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

// Add ProfileRoute component
function ProfileRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex justify-center items-center h-48"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
  if (!user) return <Redirect to="/auth" />;
  if (user.role === "Admin") {
    return (
      <AdminLayout>
        <Profile />
      </AdminLayout>
    );
  }
  return (
    <EmployeeLayout>
      <Profile />
    </EmployeeLayout>
  );
}

function SettingsRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex justify-center items-center h-48"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
  if (!user) return <Redirect to="/auth" />;
  if (user.role === "Admin") {
    return (
      <AdminLayout>
        <Settings />
      </AdminLayout>
    );
  }
  return (
    <EmployeeLayout>
      <Settings />
    </EmployeeLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/onboarding" component={Onboarding} />
      
      {/* Admin Routes */}
      <ProtectedRoute 
        path="/admin" 
        component={() => (
          <AdminLayout>
            <Dashboard />
          </AdminLayout>
        )} 
        adminOnly={true}
      />
      <ProtectedRoute 
        path="/admin/employees" 
        component={() => (
          <AdminLayout>
            <Employees />
          </AdminLayout>
        )} 
        adminOnly={true}
      />
      <ProtectedRoute 
        path="/admin/companies" 
        component={() => (
          <AdminLayout>
            <Companies />
          </AdminLayout>
        )} 
        adminOnly={true}
      />
      <ProtectedRoute 
        path="/admin/dtr-management" 
        component={() => (
          <AdminLayout>
            <DTRManagement />
          </AdminLayout>
        )} 
        adminOnly={true}
      />
      <ProtectedRoute 
        path="/admin/payroll" 
        component={() => (
          <AdminLayout>
            <Payroll />
          </AdminLayout>
        )} 
        adminOnly={true}
      />
      <ProtectedRoute 
        path="/admin/reports" 
        component={() => (
          <AdminLayout>
            <Reports />
          </AdminLayout>
        )} 
        adminOnly={true} 
      />
      <ProtectedRoute 
        path="/admin/settings" 
        component={() => (
          <AdminLayout>
            <Settings />
          </AdminLayout>
        )} 
        adminOnly={true} 
      />
      
      {/* Employee Routes */}
      <ProtectedRoute 
        path="/" 
        component={() => (
          <EmployeeLayout>
            <EmployeeDashboard />
          </EmployeeLayout>
        )} 
      />
      <ProtectedRoute 
        path="/dtr" 
        component={() => (
          <EmployeeLayout>
            <EmployeeDTR />
          </EmployeeLayout>
        )} 
      />
      <ProtectedRoute 
        path="/payslips" 
        component={() => (
          <EmployeeLayout>
            <EmployeePayroll />
          </EmployeeLayout>
        )} 
      />
      <ProtectedRoute 
        path="/profile" 
        component={ProfileRoute}
      />
      <ProtectedRoute 
        path="/settings" 
        component={SettingsRoute}
      />
      
      {/* Legacy routes for compatibility - redirect based on role */}
      <ProtectedRoute path="/dashboard" component={() => <Redirect to="/" />} />
      <ProtectedRoute path="/employees" component={() => <Redirect to="/admin/employees" />} adminOnly={true} />
      <ProtectedRoute path="/companies" component={() => <Redirect to="/admin/companies" />} adminOnly={true} />
      <ProtectedRoute path="/dtr-management" component={() => <Redirect to="/admin/dtr-management" />} adminOnly={true} />
      <ProtectedRoute path="/payroll" component={() => <Redirect to="/admin/payroll" />} adminOnly={true} />
      <ProtectedRoute path="/reports" component={() => <Redirect to="/admin/reports" />} adminOnly={true} />
      <ProtectedRoute path="/settings" component={() => <Redirect to="/admin/settings" />} adminOnly={true} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
