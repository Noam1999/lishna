import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useProfile, WHEEL_SEGMENTS, WHEEL_COOLDOWN_MS } from '@/hooks/useProfile';
import { haptic } from '@/lib/haptics';

const SIZE = 280;
const RADIUS = SIZE / 2;
const SEG_COUNT = WHEEL_SEGMENTS.length;
const SEG_ANGLE = 360 / SEG_COUNT;

// Build SVG arc path for a slice
const slicePath = (i: number) => {
  const start = (i * SEG_ANGLE - 90) * (Math.PI / 180);
  const end = ((i + 1) * SEG_ANGLE - 90) * (Math.PI / 180);
  const x1 = RADIUS + RADIUS * Math.cos(start);
  const y1 = RADIUS + RADIUS * Math.sin(start);
  const x2 = RADIUS + RADIUS * Math.cos(end);
  const y2 = RADIUS + RADIUS * Math.sin(end);
  return `M${RADIUS},${RADIUS} L${x1},${y1} A${RADIUS},${RADIUS} 0 0 1 ${x2},${y2} Z`;
};

const formatRemaining = (ms: number) => {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const LuckyWheel = () => {
  const { profile, spinWheel } = useProfile();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [reveal, setReveal] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const bonusSpins = profile?.wheel_spins || 0;
  const cooldownRemaining = useMemo(() => {
    if (bonusSpins > 0) return 0;
    if (!profile?.last_wheel_spin_at) return 0;
    const elapsed = now - new Date(profile.last_wheel_spin_at).getTime();
    return Math.max(0, WHEEL_COOLDOWN_MS - elapsed);
  }, [profile?.last_wheel_spin_at, now, bonusSpins]);

  const ready = cooldownRemaining === 0 && !spinning;

  const handleSpin = async () => {
    if (!ready) return;
    haptic(15);
    setSpinning(true);
    setReveal(null);
    const result = await spinWheel();
    if ('error' in result) {
      setSpinning(false);
      toast.error('הסיבוב לא זמין כרגע');
      return;
    }
    const { segmentIndex, prize } = result;
    // Pointer is at top (12 o'clock). Segment center angle = i*SEG_ANGLE + SEG_ANGLE/2 measured clockwise from top.
    // We rotate the wheel so the chosen segment center lands at the top.
    const centerAngle = segmentIndex * SEG_ANGLE + SEG_ANGLE / 2;
    const target = 360 * 6 - centerAngle; // 6 full spins for drama
    setRotation((prev) => prev + (target - (prev % 360)));
    setTimeout(() => {
      setSpinning(false);
      setReveal(prize.label);
      if (prize.kind === 'none') toast('הפעם בלי פרס · נסה שוב מחר');
      else toast.success(`זכית ב-${prize.label}! 🎉`);
    }, 4200);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
      <div className="text-center mb-3">
        <h3 className="text-lg font-bold text-foreground">🎡 גלגל המזל היומי</h3>
        <p className="text-xs text-muted-foreground">סיבוב חינם כל 24 שעות</p>
      </div>

      <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
        {/* Pointer */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-10"
          style={{ top: -6 }}
        >
          <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary drop-shadow-md" />
        </div>

        {/* Wheel */}
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.17, 0.67, 0.16, 0.99] }}
          style={{ width: SIZE, height: SIZE }}
          className="rounded-full shadow-elegant"
        >
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            {WHEEL_SEGMENTS.map((seg, i) => {
              const labelAngle = i * SEG_ANGLE + SEG_ANGLE / 2 - 90;
              const lr = RADIUS * 0.62;
              const lx = RADIUS + lr * Math.cos((labelAngle * Math.PI) / 180);
              const ly = RADIUS + lr * Math.sin((labelAngle * Math.PI) / 180);
              return (
                <g key={i}>
                  <path d={slicePath(i)} fill={seg.color} stroke="#fff" strokeWidth={2} />
                  <text
                    x={lx}
                    y={ly}
                    fill="#fff"
                    fontSize={11}
                    fontWeight={700}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${labelAngle + 90}, ${lx}, ${ly})`}
                  >
                    {seg.prize.kind === 'none' ? '✕' : seg.prize.label}
                  </text>
                </g>
              );
            })}
            <circle cx={RADIUS} cy={RADIUS} r={18} fill="#fff" stroke="#e5e7eb" strokeWidth={2} />
          </svg>
        </motion.div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-2">
        <Button onClick={handleSpin} disabled={!ready} size="lg" className="w-full">
          {spinning ? 'מסתובב…' : ready ? (bonusSpins > 0 ? `סובב את הגלגל (${bonusSpins} בונוס)` : 'סובב את הגלגל') : `זמין בעוד ${formatRemaining(cooldownRemaining)}`}
        </Button>
        <AnimatePresence>
          {reveal && !spinning && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm font-semibold text-primary"
            >
              זכית: {reveal}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LuckyWheel;
