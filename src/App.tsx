import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useLanguageSync } from "./hooks/useLanguageSync";
import { LanguageDetectionBanner } from "./components/LanguageDetectionBanner";
import { OfflineIndicator } from "./components/OfflineIndicator";
import ErrorBoundary from "./components/ErrorBoundary";
import { ReducedMotionProvider } from "./components/ReducedMotionProvider";
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
import DriverEarnings from "./pages/DriverEarnings";
import DriverAnalytics from "./pages/DriverAnalytics";
import DriverChat from "./pages/DriverChat";
import AdminAuth from "./pages/AdminAuth";
import AdminDashboard from "./pages/AdminDashboard";
import ResetPassword from "./pages/ResetPassword";
import CarRentals from "./pages/CarRentals";
import CarDetail from "./pages/CarDetail";
import CarBooking from "./pages/CarBooking";
import RideBooking from "./pages/RideBooking";
import PassengerRentals from "./pages/PassengerRentals";
import RentalTracking from "./pages/RentalTracking";
import VehicleShowcase from "./pages/VehicleShowcase";
import PublicRideTracking from "./pages/PublicRideTracking";

// Create QueryClient outside component to avoid hot reload issues
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

const App = () => {
  useLanguageSync();
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ReducedMotionProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <OfflineIndicator />
            <LanguageDetectionBanner />
            <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/passenger/auth" element={<PassengerAuth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/cars" element={<CarRentals />} />
              <Route path="/cars/:id" element={<CarDetail />} />
              <Route path="/cars/:id/book" element={<CarBooking />} />
              <Route path="/rentals/:id/track" element={<RentalTracking />} />
              <Route path="/passenger/rentals" element={<PassengerRentals />} />
              <Route path="/passenger" element={<PassengerDashboard />} />
              <Route path="/passenger/book-ride" element={<RideBooking />} />
              <Route path="/passenger/ride/:rideId" element={<PassengerRideStatus />} />
              <Route path="/passenger/chat/:rideId" element={<PassengerChat />} />
              <Route path="/passenger/rate/:rideId" element={<PassengerRating />} />
              <Route path="/passenger/history" element={<PassengerHistory />} />
              <Route path="/passenger/profile" element={<PassengerProfile />} />
              <Route path="/vehicles" element={<VehicleShowcase />} />
              <Route path="/track-ride/:rideId" element={<PublicRideTracking />} />
              <Route path="/driver/auth" element={<DriverAuth />} />
              <Route path="/driver/dashboard" element={<DriverDashboard />} />
              <Route path="/driver/earnings" element={<DriverEarnings />} />
              <Route path="/driver/analytics" element={<DriverAnalytics />} />
              <Route path="/driver/chat/:rideId" element={<DriverChat />} />
              <Route path="/admin/auth" element={<AdminAuth />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </ReducedMotionProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
