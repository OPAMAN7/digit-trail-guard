import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Score } from "./pages/Score";
import { History } from "./pages/History";
import { DeletionRequest } from "./pages/DeletionRequest";
import { AISummary } from "./pages/AISummary";
import { Footprints } from "./pages/Footprints";
import { SocialMedia } from "./pages/SocialMedia";
import { Login } from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="score" element={<Score />} />
          <Route path="history" element={<History />} />
          <Route path="deletion-request" element={<DeletionRequest />} />
          <Route path="ai-summary" element={<AISummary />} />
          <Route path="footprints" element={<Footprints />} />
          <Route path="social-media" element={<SocialMedia />} />
        </Route>
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
