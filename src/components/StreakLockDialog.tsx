import { Link } from 'react-router-dom';
import { Flame, LogIn } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface StreakLockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StreakLockDialog = ({ open, onOpenChange }: StreakLockDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader className="items-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-2 mx-auto">
            <Flame className="w-8 h-8 text-destructive" />
          </div>
          <DialogTitle className="text-lg">הלהבה שלך בסכנה! 🔥</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            כדי לשמור על רצף הלמידה שלך למחר, עליך ליצור חשבון חינמי.
          </DialogDescription>
        </DialogHeader>
        <Button asChild className="w-full mt-2">
          <Link to="/auth">
            <LogIn className="w-4 h-4 ml-2" />
            צור חשבון חינמי
          </Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default StreakLockDialog;
