import { useNavigate } from 'react-router-dom';
import { Brain, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface QuizTriggerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuizTriggerDialog = ({ open, onOpenChange }: QuizTriggerDialogProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl text-center" dir="rtl">
        <DialogHeader className="items-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2 mx-auto">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-display">כל הכבוד! 🎉</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground leading-relaxed">
            למדת 4 מילים חדשות. מוכן לבחון את עצמך?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <Button
            onClick={() => {
              onOpenChange(false);
              navigate('/quiz');
            }}
            className="w-full h-12 text-base"
          >
            <Brain className="w-5 h-5 ml-2" />
            עבור למבחן עכשיו
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            אחר כך
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuizTriggerDialog;
