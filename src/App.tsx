import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DictionaryProvider } from "@/contexts/DictionaryContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import GuestBanner from "@/components/GuestBanner";
import FeedbackButton from "@/components/FeedbackButton";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Friends from "./pages/Friends";
import Translator from "./pages/Translator";
import Flashcards from "./pages/Flashcards";
import Quiz from "./pages/Quiz";
import QuizSummary from "./pages/QuizSummary";
import Leaderboard from "./pages/Leaderboard";
import Feed from "./pages/Feed";
import NotFound from "./pages/NotFound";
import AdminFeedback from "./pages/AdminFeedback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DictionaryProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <GuestBanner />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/translator" element={<Translator />} />
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/quiz-summary" element={<QuizSummary />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <FeedbackButton />
            <Navigation />
          </BrowserRouter>
        </TooltipProvider>
      </DictionaryProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
