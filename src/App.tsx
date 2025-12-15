import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AgencyThemeProvider } from "@/contexts/AgencyThemeContext";

// Pages
import Landing from "./pages/Landing";
import Browse from "./pages/Browse";
import PropertyDetail from "./pages/PropertyDetail";
import CalculatorPage from "./pages/CalculatorPage";
import CheckIn from "./pages/CheckIn";
import MyViewings from "./pages/MyViewings";

// Buyer Pages
import LiveAuction from "./pages/buyer/LiveAuction";

// Agent Pages
import AgentDashboard from "./pages/agent/Dashboard";
import AgentProperties from "./pages/agent/Properties";
import AgentRequests from "./pages/agent/Requests";
import AgentInspections from "./pages/agent/Inspections";
import AgentAppraisals from "./pages/agent/Appraisals";
import AgentAuctions from "./pages/agent/Auctions";
import AuctionConsole from "./pages/agent/AuctionConsole";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <AgencyThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Landing / Home */}
            <Route path="/" element={<Landing />} />

            {/* Buyer View Routes */}
            <Route path="/browse" element={<Browse />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/calculator" element={<CalculatorPage />} />
            <Route path="/checkin" element={<CheckIn />} />
            <Route path="/viewings" element={<MyViewings />} />
            <Route path="/auction/live/:id" element={<LiveAuction />} />

            {/* Agent View Routes */}
            <Route path="/agent" element={<AgentDashboard />} />
            <Route path="/agent/dashboard" element={<AgentDashboard />} />
            <Route path="/agent/properties" element={<AgentProperties />} />
            <Route path="/agent/property/:id" element={<PropertyDetail />} />
            <Route path="/agent/requests" element={<AgentRequests />} />
            <Route path="/agent/inspections" element={<AgentInspections />} />
            <Route path="/agent/appraisals" element={<AgentAppraisals />} />
            <Route path="/agent/auctions" element={<AgentAuctions />} />
            <Route path="/agent/auction/:id/run" element={<AuctionConsole />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AgencyThemeProvider>
);

export default App;
