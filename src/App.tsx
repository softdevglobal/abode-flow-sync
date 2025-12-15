import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

// Pages
import Landing from "./pages/Landing";
import Browse from "./pages/Browse";
import PropertyDetail from "./pages/PropertyDetail";
import CalculatorPage from "./pages/CalculatorPage";
import CheckIn from "./pages/CheckIn";
import MyViewings from "./pages/MyViewings";
import Auth from "./pages/Auth";

// Agent Pages
import AgentDashboard from "./pages/agent/Dashboard";
import AgentProperties from "./pages/agent/Properties";
import AgentRequests from "./pages/agent/Requests";
import AgentInspections from "./pages/agent/Inspections";
import AgentAppraisals from "./pages/agent/Appraisals";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public / Landing */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />

            {/* Public Routes */}
            <Route path="/browse" element={<Browse />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/calculator" element={<CalculatorPage />} />
            <Route path="/checkin" element={<CheckIn />} />

            {/* Customer Protected Routes */}
            <Route
              path="/viewings"
              element={
                <ProtectedRoute requiredRole="customer">
                  <MyViewings />
                </ProtectedRoute>
              }
            />

            {/* Agent Protected Routes */}
            <Route
              path="/agent"
              element={
                <ProtectedRoute requiredRole="agent">
                  <AgentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/dashboard"
              element={
                <ProtectedRoute requiredRole="agent">
                  <AgentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/properties"
              element={
                <ProtectedRoute requiredRole="agent">
                  <AgentProperties />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/property/:id"
              element={
                <ProtectedRoute requiredRole="agent">
                  <PropertyDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/requests"
              element={
                <ProtectedRoute requiredRole="agent">
                  <AgentRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/inspections"
              element={
                <ProtectedRoute requiredRole="agent">
                  <AgentInspections />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/appraisals"
              element={
                <ProtectedRoute requiredRole="agent">
                  <AgentAppraisals />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
