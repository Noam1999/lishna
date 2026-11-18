import { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import AnimatedFlame from './AnimatedFlame';

const ilDate = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });

/** Monthly calendar; streak days = `streak` consecutive days ending at the last quiz day. */
const StreakCalendarDialog = ({ open, onOpenChange, streak, lastQuizDate }: {
  open: boolean; onOpenChange: (o: boolean) => void; streak: number; lastQuizDate: string | null;
}) => {
  const [offset, setOffset] = useState(0);
  const lit = new Set<string>();
  if (lastQuizDate) {
    const end = new Date(ilDate(new Date(lastQuizDate)) + 'T12:00:00');
    for (let i = 0; i < streak; i++) lit.add(ilDate(new Date(end.getTime() - i * 864e5)));
  }
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1, 12);
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const today = ilDate(now);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-sm rounded-[2rem]">
        <div className="flex flex-col items-center">
          <AnimatedFlame size={60} />
          <DialogTitle className="text-2xl font-black text-orange-500 mt-1">{streak} ימי רצף</DialogTitle>
        </div>
        <div className="flex items-center justify-between mt-2">
          <button onClick={() => setOffset(offset - 1)} aria-label="חודש קודם"><ChevronRight className="w-5 h-5" /></button>
          <span className="font-semibold">{first.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}</span>
          <button onClick={() => setOffset(Math.min(0, offset + 1))} aria-label="חודש הבא"><ChevronLeft className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center text-xs" dir="rtl">
          {['א','ב','ג','ד','ה','ו','ש'].map((d) => <span key={d} className="text-muted-foreground">{d}</span>)}
          {Array.from({ length: first.getDay() }, (_, i) => <span key={'e' + i} />)}
          {Array.from({ length: days }, (_, i) => {
            const key = ilDate(new Date(first.getFullYear(), first.getMonth(), i + 1, 12));
            const on = lit.has(key);
            return (
              <span key={key} className={`aspect-square rounded-xl flex items-center justify-center font-semibold ${
                on ? 'bg-orange-500/20 text-orange-500' : 'glass text-muted-foreground'} ${key === today ? 'ring-2 ring-primary' : ''}`}>
                {on ? '🔥' : i + 1}
              </span>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default StreakCalendarDialog;
