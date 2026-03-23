import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const BETA_POPUP_KEY = 'lishna_beta_popup_dismissed';

const BetaWelcomePopup = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(BETA_POPUP_KEY);
    if (!dismissed) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    sessionStorage.setItem(BETA_POPUP_KEY, 'true');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-sm text-center" dir="rtl">
        <button
          onClick={handleClose}
          className="absolute top-3 left-3 p-1.5 rounded-full hover:bg-muted transition-colors"
          aria-label="סגור"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="flex flex-col items-center gap-4 pt-2">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-primary" />
          </div>

          <h2 className="text-lg font-bold text-foreground">גרסת בטא 🧪</h2>

          <p className="text-sm text-muted-foreground leading-relaxed">
            היי שלום, האתר בגרסת בטא. יכול להיות שמדי פעם יהיו תקלות או בעיות.
            <br />
            לפניות:{' '}
            <a href="mailto:playcom1999@gmail.com" className="text-primary underline">
              playcom1999@gmail.com
            </a>
          </p>

          <p className="text-xs text-muted-foreground">בתודה: צוות לישנא 💙</p>

          <button
            onClick={handleClose}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            הבנתי, בוא נתחיל!
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BetaWelcomePopup;
