import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/learning-style" element={<LearningStylePage />} />
            <Route path="/submit" element={<SubmitAssignment />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/reading" element={<VoiceReadingPage />} />
            <Route path="/report-upload" element={<ReportUploadPage />} />
            <Route path="/essay-checker" element={<EssayCheckerPage />} />
            <Route path="/answer-sheet" element={<AnswerSheetPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/classrooms" element={<Classrooms />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
