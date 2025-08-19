import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PassengerAuth from "./pages/PassengerAuth";
import PassengerDashboard from "./pages/PassengerDashboard";
import PassengerRideStatus from "./pages/PassengerRideStatus";
import PassengerChat from "./pages/PassengerChat";
import PassengerRating from "./pages/PassengerRating";
import PassengerHistory from "./pages/PassengerHistory";
import PassengerProfile from "./pages/PassengerProfile";
import DriverAuth from "./pages/DriverAuth";
import DriverDashboard from "./pages/DriverDashboard";

const App = () => {
  // Create QueryClient only once per app instance
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
      },
    },
  }));
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/passenger/auth" element={<PassengerAuth />} />
            <Route path="/passenger" element={<PassengerDashboard />} />
            <Route path="/passenger/ride/:rideId" element={<PassengerRideStatus />} />
            <Route path="/passenger/chat/:rideId" element={<PassengerChat />} />
            <Route path="/passenger/rate/:rideId" element={<PassengerRating />} />
            <Route path="/passenger/history" element={<PassengerHistory />} />
            <Route path="/passenger/profile" element={<PassengerProfile />} />
            <Route path="/driver/auth" element={<DriverAuth />} />
            <Route path="/driver/dashboard" element={<DriverDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
