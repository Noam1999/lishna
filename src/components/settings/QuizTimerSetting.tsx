import { useState } from 'react';
import { Timer } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

const QuizTimerSetting = () => {
  const [timer, setTimer] = useState(() => {
    const saved = localStorage.getItem('quiz_timer');
    return saved ? parseInt(saved, 10) : 15;
  });

  const handleChange = (value: number[]) => {
    const v = value[0];
    setTimer(v);
    localStorage.setItem('quiz_timer', String(v));
  };

  return (
    <div className="bg-card rounded-2xl p-5 shadow-soft border border-border">
      <div className="flex items-center gap-3 mb-4">
        <Timer className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">טיימר חידון</h3>
        <span className="mr-auto text-lg font-bold text-primary">{timer} שניות</span>
      </div>
      <Slider
        value={[timer]}
        onValueChange={handleChange}
        min={5}
        max={30}
        step={5}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>30</span>
        <span>5</span>
      </div>
    </div>
  );
};

export default QuizTimerSetting;
