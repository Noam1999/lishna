import { useState } from 'react';
import { ArrowLeftRight, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useProfile, COINS_PER_DIAMOND } from '@/hooks/useProfile';

const ExchangeHub = () => {
  const { profile, exchangeCoinsToDiamonds, exchangeDiamondsToCoins } = useProfile();
  const [amount, setAmount] = useState(1);
  const [busy, setBusy] = useState(false);

  const maxByCoins = Math.floor((profile?.coins ?? 0) / COINS_PER_DIAMOND);
  const maxByDiamonds = profile?.diamonds ?? 0;

  const buyDiamonds = async () => {
    if (busy) return;
    if (amount < 1) return;
    setBusy(true);
    const { error } = await exchangeCoinsToDiamonds(amount);
    setBusy(false);
    if (error) { toast.error('אין מספיק מטבעות'); return; }
    toast.success(`קיבלת ${amount} 💎`);
  };

  const sellDiamonds = async () => {
    if (busy) return;
    if (amount < 1) return;
    setBusy(true);
    const { error } = await exchangeDiamondsToCoins(amount);
    setBusy(false);
    if (error) { toast.error('אין מספיק יהלומים'); return; }
    toast.success(`קיבלת ${amount * COINS_PER_DIAMOND} 💰`);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft">
      <div className="flex items-center gap-2 mb-1">
        <ArrowLeftRight className="w-4 h-4 text-primary" />
        <h3 className="text-lg font-bold text-foreground">קופת המרות</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">{COINS_PER_DIAMOND} 💰 = 1 💎</p>

      <div className="flex items-center justify-center gap-3 mb-4">
        <Button variant="outline" size="icon" onClick={() => setAmount((a) => Math.max(1, a - 1))} aria-label="הפחת">
          <Minus className="w-4 h-4" />
        </Button>
        <div className="text-center min-w-[90px]">
          <p className="text-2xl font-bold text-foreground">{amount} 💎</p>
          <p className="text-xs text-muted-foreground">= {amount * COINS_PER_DIAMOND} 💰</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => setAmount((a) => a + 1)} aria-label="הוסף">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button onClick={buyDiamonds} disabled={busy || amount > maxByCoins}>
          המר ל-💎
        </Button>
        <Button variant="secondary" onClick={sellDiamonds} disabled={busy || amount > maxByDiamonds}>
          המר ל-💰
        </Button>
      </div>
    </div>
  );
};

export default ExchangeHub;
