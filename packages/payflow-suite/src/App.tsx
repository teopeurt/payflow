import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from '@payflow/core/auth';
import { useToast } from '@/components/ui/use-toast';
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Estimates from "./pages/Estimates";
import EstimateDetails from "./pages/EstimateDetails";
import NewEstimate from "./pages/NewEstimate";
import EditEstimate from "./pages/EditEstimate";
import Quotes from "./pages/Quotes";
import NewQuote from "./pages/NewQuote";
import QuoteDetails from "./pages/QuoteDetails";
import EditQuote from "./pages/EditQuote";
import Invoices from "./pages/Invoices";
import NewInvoice from "./pages/NewInvoice";
import InvoiceDetails from "./pages/InvoiceDetails";
import EditInvoice from "./pages/EditInvoice";
import Clients from "./pages/Clients";
import ClientDetails from "./pages/ClientDetails";
import NewClient from "./pages/NewClient";
import EditClient from "./pages/EditClient";
import Projects from "./pages/Projects";
import NewProject from "./pages/NewProject";
import ProjectDetails from "./pages/ProjectDetails";
import EditProject from "./pages/EditProject";
import Payments from "./pages/Payments";
import Documents from "./pages/Documents";
import Messages from "./pages/Messages";
import Calendar from "./pages/Calendar";
import Profile from "./pages/Profile";
import Testing from "./pages/Testing";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const AppContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignInSuccess = () => {
    navigate('/');
    toast({
      title: "Login successful",
      description: "Welcome back!",
    });
  };

  const handleSignInError = (error: Error) => {
    toast({
      title: "Login failed",
      description: error.message,
      variant: "destructive"
    });
  };

  const handleSignUpSuccess = () => {
    navigate('/auth', { state: { registrationSuccess: true } });
    toast({
      title: "Registration successful",
      description: "Please check your email for verification.",
    });
  };

  const handleSignUpError = (error: Error) => {
    toast({
      title: "Registration failed",
      description: error.message,
      variant: "destructive"
    });
  };

  const handleSignOutSuccess = () => {
    toast({
      title: "Logged out successfully"
    });
  };

  const handleSignOutError = (error: Error) => {
    toast({
      title: "Error signing out",
      description: error.message,
      variant: "destructive"
    });
  };

  const handleSignedOut = () => {
    navigate('/auth');
  };

  return (
    <AuthProvider
      onSignInSuccess={handleSignInSuccess}
      onSignInError={handleSignInError}
      onSignUpSuccess={handleSignUpSuccess}
      onSignUpError={handleSignUpError}
      onSignOutSuccess={handleSignOutSuccess}
      onSignOutError={handleSignOutError}
      onSignedOut={handleSignedOut}
    >
      <Toaster />
      <Sonner />
      <Routes>
        <Route element={<ProtectedRoute requireAuth={false} />}>
          <Route path="/auth" element={<Auth />} />
        </Route>

        <Route element={<ProtectedRoute requireAuth={true} />}>
          <Route path="/" element={<MainLayout><Index /></MainLayout>} />
          
          <Route path="/clients" element={<MainLayout><Clients /></MainLayout>} />
          <Route path="/clients/new" element={<MainLayout><NewClient /></MainLayout>} />
          <Route path="/clients/:id" element={<MainLayout><ClientDetails /></MainLayout>} />
          <Route path="/clients/:id/edit" element={<MainLayout><EditClient /></MainLayout>} />
          
          <Route path="/projects" element={<MainLayout><Projects /></MainLayout>} />
          <Route path="/projects/new" element={<MainLayout><NewProject /></MainLayout>} />
          <Route path="/projects/:id" element={<MainLayout><ProjectDetails /></MainLayout>} />
          <Route path="/projects/:id/edit" element={<MainLayout><EditProject /></MainLayout>} />
          
          <Route path="/documents" element={<MainLayout><Documents /></MainLayout>} />
          <Route path="/messages" element={<MainLayout><Messages /></MainLayout>} />
          <Route path="/calendar" element={<MainLayout><Calendar /></MainLayout>} />
          
          <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
          
          <Route path="/estimates" element={<MainLayout><Estimates /></MainLayout>} />
          <Route path="/estimates/new" element={<MainLayout><NewEstimate /></MainLayout>} />
          <Route path="/estimates/:id" element={<MainLayout><EstimateDetails /></MainLayout>} />
          <Route path="/estimates/:id/edit" element={<MainLayout><EditEstimate /></MainLayout>} />
          <Route path="/quotes" element={<MainLayout><Quotes /></MainLayout>} />
          <Route path="/quotes/new" element={<MainLayout><NewQuote /></MainLayout>} />
          <Route path="/quotes/:id" element={<MainLayout><QuoteDetails /></MainLayout>} />
          <Route path="/quotes/:id/edit" element={<MainLayout><EditQuote /></MainLayout>} />
          <Route path="/purchase-orders" element={<MainLayout><NotFound /></MainLayout>} />
          <Route path="/invoices" element={<MainLayout><Invoices /></MainLayout>} />
          <Route path="/invoices/new" element={<MainLayout><NewInvoice /></MainLayout>} />
          <Route path="/invoices/:id" element={<MainLayout><InvoiceDetails /></MainLayout>} />
          <Route path="/invoices/:id/edit" element={<MainLayout><EditInvoice /></MainLayout>} />
          <Route path="/payments" element={<MainLayout><Payments /></MainLayout>} />
          <Route path="/reports" element={<MainLayout><NotFound /></MainLayout>} />
          <Route path="/testing" element={<MainLayout><Testing /></MainLayout>} />
          <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
