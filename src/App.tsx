import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DictionaryProvider } from "@/contexts/DictionaryContext";
import Navigation from "@/components/Navigation";
import Home from "./pages/Home";
import Translator from "./pages/Translator";
import Flashcards from "./pages/Flashcards";
import Quiz from "./pages/Quiz";
import QuizSummary from "./pages/QuizSummary";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DictionaryProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/translator" element={<Translator />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/quiz-summary" element={<QuizSummary />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Navigation />
        </BrowserRouter>
      </TooltipProvider>
    </DictionaryProvider>
  </QueryClientProvider>
);

export default App;
