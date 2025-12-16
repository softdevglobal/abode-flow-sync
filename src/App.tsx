import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AgencyThemeProvider } from "@/contexts/AgencyThemeContext";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/layout/PageTransition";

// Pages
import Landing from "./pages/Landing";
import Browse from "./pages/Browse";
import PropertyDetail from "./pages/PropertyDetail";
import CalculatorPage from "./pages/CalculatorPage";
import CheckIn from "./pages/CheckIn";
import MyViewings from "./pages/MyViewings";
import MyInspections from "./pages/MyInspections";
import SavedProperties from "./pages/SavedProperties";
import Auth from "./pages/Auth";
import Contact from "./pages/Contact";
import HowItWorks from "./pages/HowItWorks";

// Buyer Pages
import LiveAuction from "./pages/buyer/LiveAuction";
import BuyerProfile from "./pages/buyer/Profile";
import BuyerAppraisals from "./pages/buyer/Appraisals";
import Auctions from "./pages/Auctions";

// Agent Pages
import AgentDashboard from "./pages/agent/Dashboard";
import AgentProperties from "./pages/agent/Properties";
import AgentRequests from "./pages/agent/Requests";
import AgentInspections from "./pages/agent/Inspections";
import AgentAppraisals from "./pages/agent/Appraisals";
import AgentAuctions from "./pages/agent/Auctions";
import AuctionConsole from "./pages/agent/AuctionConsole";
import AgentCRM from "./pages/agent/CRM";
import AgentNotifications from "./pages/agent/Notifications";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Redirect component that preserves query params
const CheckInRedirect = () => {
  const location = useLocation();
  return <Navigate to={`/checkin${location.search}`} replace />;
};

// Animated Routes component to access location
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Landing / Home */}
        <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/how-it-works" element={<PageTransition><HowItWorks /></PageTransition>} />

        {/* Buyer View Routes */}
        <Route path="/browse" element={<PageTransition><Browse /></PageTransition>} />
        <Route path="/property/:id" element={<PageTransition><PropertyDetail /></PageTransition>} />
        <Route path="/calculator" element={<PageTransition><CalculatorPage /></PageTransition>} />
        <Route path="/checkin" element={<PageTransition><CheckIn /></PageTransition>} />
        <Route path="/check-in" element={<CheckInRedirect />} />
        <Route path="/viewings" element={<PageTransition><MyViewings /></PageTransition>} />
        <Route path="/inspections" element={<PageTransition><MyInspections /></PageTransition>} />
        <Route path="/saved" element={<PageTransition><SavedProperties /></PageTransition>} />
        <Route path="/auctions" element={<PageTransition><Auctions /></PageTransition>} />
        <Route path="/auction/live/:id" element={<PageTransition><LiveAuction /></PageTransition>} />
        <Route path="/appraisals" element={<PageTransition><BuyerAppraisals /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><BuyerProfile /></PageTransition>} />

        {/* Agent View Routes */}
        <Route path="/agent" element={<PageTransition><AgentDashboard /></PageTransition>} />
        <Route path="/agent/dashboard" element={<PageTransition><AgentDashboard /></PageTransition>} />
        <Route path="/agent/properties" element={<PageTransition><AgentProperties /></PageTransition>} />
        <Route path="/agent/property/:id" element={<PageTransition><PropertyDetail /></PageTransition>} />
        <Route path="/agent/requests" element={<PageTransition><AgentRequests /></PageTransition>} />
        <Route path="/agent/inspections" element={<PageTransition><AgentInspections /></PageTransition>} />
        <Route path="/agent/appraisals" element={<PageTransition><AgentAppraisals /></PageTransition>} />
        <Route path="/agent/auctions" element={<PageTransition><AgentAuctions /></PageTransition>} />
        <Route path="/agent/auction/:id/run" element={<PageTransition><AuctionConsole /></PageTransition>} />
        <Route path="/agent/crm" element={<PageTransition><AgentCRM /></PageTransition>} />
        <Route path="/agent/notifications" element={<PageTransition><AgentNotifications /></PageTransition>} />

        {/* Catch-all */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

// Main App component with providers
const App = () => (
  <ThemeProvider>
    <AgencyThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <AnimatedRoutes />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </AgencyThemeProvider>
  </ThemeProvider>
);

export default App;
