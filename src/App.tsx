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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/passenger/auth" element={<PassengerAuth />} />
          <Route path="/passenger" element={<PassengerDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
