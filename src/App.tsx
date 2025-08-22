import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import GovernmentBudgets from "./pages/GovernmentBudgets";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { Protected } from "./components/auth/Protected";
import { AuthProvider } from "./context/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Protected><Index /></Protected>} />
          <Route path="/overview" element={<Protected><Index /></Protected>} />
          <Route path="/finance" element={<Protected><Index /></Protected>} />
          <Route path="/finance/regular-budget" element={<Protected><Index /></Protected>} />
          <Route path="/finance/tabarim" element={<Protected><Index /></Protected>} />
          <Route path="/finance/collection" element={<Protected><Index /></Protected>} />
          <Route path="/finance/salary" element={<Protected><Index /></Protected>} />
          <Route path="/education" element={<Protected><Index /></Protected>} />
          <Route path="/engineering" element={<Protected><Index /></Protected>} />
          <Route path="/welfare" element={<Protected><Index /></Protected>} />
          <Route path="/non-formal" element={<Protected><Index /></Protected>} />
          <Route path="/business" element={<Protected><Index /></Protected>} />
          <Route path="/government-budgets/*" element={<Protected><GovernmentBudgets /></Protected>} />
          <Route path="/grants" element={<Protected><Index /></Protected>} />
          <Route path="/projects" element={<Protected><Index /></Protected>} />
          <Route path="/tasks" element={<Protected><Index /></Protected>} />
          <Route path="/inquiries" element={<Protected><Index /></Protected>} />
          <Route path="/profile" element={<Protected><Index /></Protected>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;
