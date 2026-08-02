import { Analytics } from '@vercel/analytics/react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from 'framer-motion';
import { DictionaryProvider } from "@/contexts/DictionaryContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AvatarProvider } from "@/contexts/AvatarContext";
import Navigation from "@/components/Navigation";
import GuestBanner from "@/components/GuestBanner";
import FeedbackButton from "@/components/FeedbackButton";
import BetaWelcomePopup from "@/components/BetaWelcomePopup";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
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
import SettingsPage from "./pages/Settings";
import Classes from "./pages/Classes";
import ClassDetail from "./pages/ClassDetail";
import TakeAssignment from "./pages/TakeAssignment";
import Shop from "./pages/Shop";
import School from "./pages/School";
import Chat from "./pages/Chat";
import Inbox from "./pages/Inbox";
import Wardrobe from "./pages/Wardrobe";
import Duel from "./pages/Duel";
import Pass from "./pages/Pass";
import Experiential from "./pages/Experiential";
import RewardFlight from "./components/RewardFlight";
import NotificationPrompt from "./components/NotificationPrompt";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/translator" element={<Translator />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/quiz-summary" element={<QuizSummary />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/admin/feedback" element={<AdminFeedback />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/classes/:id" element={<ClassDetail />} />
        <Route path="/assignment/:id" element={<TakeAssignment />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/school" element={<School />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/chat/:userId" element={<Chat />} />
        <Route path="/wardrobe" element={<Wardrobe />} />
        <Route path="/duel" element={<Duel />} />
        <Route path="/duel/:code" element={<Duel />} />
        <Route path="/pass" element={<Pass />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AvatarProvider>
        <DictionaryProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Analytics />
            <BrowserRouter>
              <BetaWelcomePopup />
              <GuestBanner />
              <AnimatedRoutes />
              <RewardFlight />
              <NotificationPrompt />
              <FeedbackButton />
              <Navigation />
            </BrowserRouter>
          </TooltipProvider>
        </DictionaryProvider>
      </AvatarProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
