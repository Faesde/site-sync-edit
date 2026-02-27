import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Contacts from "./pages/Contacts";
import Plans from "./pages/Plans";
import Settings from "./pages/Settings";
import Results from "./pages/Results";
import Help from "./pages/Help";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

// Industry Pages
import Ecommerce from "./pages/industries/Ecommerce";
import Affiliates from "./pages/industries/Affiliates";
import LocalBusiness from "./pages/industries/LocalBusiness";

// Feature Pages
import Automation from "./pages/features/Automation";
import WhatsAppMarketing from "./pages/features/WhatsAppMarketing";
import EmailMarketing from "./pages/features/EmailMarketing";
import SmsMarketing from "./pages/features/SmsMarketing";
import VoiceMarketing from "./pages/features/VoiceMarketing";

// Integration Pages
import IntegrationsPage from "./pages/integrations/IntegrationsPage";
import IntegrationDetail from "./pages/integrations/IntegrationDetail";
import Dados4UConsulta from "./pages/Dados4UConsulta";

// Admin Pages
import Admin from "./pages/Admin";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminTreinamentos from "./pages/admin/AdminTreinamentos";

// Public Content Pages
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Treinamentos from "./pages/Treinamentos";

// Auth Pages
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/results" element={<Results />} />
            
            {/* Help Pages */}
            <Route path="/help" element={<Help />} />
            <Route path="/contact" element={<Contact />} />
            
            {/* Industry Pages */}
            <Route path="/industries/ecommerce" element={<Ecommerce />} />
            <Route path="/industries/affiliates" element={<Affiliates />} />
            <Route path="/industries/local-business" element={<LocalBusiness />} />
            
            {/* Feature Pages */}
            <Route path="/features/automation" element={<Automation />} />
            <Route path="/features/whatsapp-marketing" element={<WhatsAppMarketing />} />
            <Route path="/features/email-marketing" element={<EmailMarketing />} />
            <Route path="/features/sms-marketing" element={<SmsMarketing />} />
            <Route path="/features/voice-marketing" element={<VoiceMarketing />} />
            
            {/* Integration Pages */}
            <Route path="/integrations" element={<IntegrationsPage />} />
            <Route path="/integrations/:slug" element={<IntegrationDetail />} />
            <Route path="/dados4u" element={<Dados4UConsulta />} />
            
            {/* Admin Pages */}
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/blog" element={<AdminBlog />} />
            <Route path="/admin/treinamentos" element={<AdminTreinamentos />} />
            
            {/* Public Content Pages */}
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/treinamentos" element={<Treinamentos />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
