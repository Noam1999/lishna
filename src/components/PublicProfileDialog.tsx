import { useEffect, useState } from 'react';
import { Trophy, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

export const getRankTitle = (points: number): string => {
  if (points >= 10000) return 'אמן הארמית';
  if (points >= 5000) return 'מומחה';
  if (points >= 2500) return 'מתקדם פלוס';
  if (points >= 1000) return 'מתקדם';
  if (points >= 500) return 'לומד מסור';
  if (points >= 100) return 'מתחיל';
  return 'חדש';
};

interface PublicProfileData {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  points: number;
  coins: number;
  diamonds: number;
  created_at: string;
}

interface PublicProfileDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PublicProfileDialog = ({ userId, open, onOpenChange }: PublicProfileDialogProps) => {
  const [data, setData] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !open) return;
    setLoading(true);
    setData(null);
    (async () => {
      const { data: p } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, points, coins, diamonds, created_at')
        .eq('user_id', userId)
        .maybeSingle();
      setData(p as unknown as PublicProfileData | null);
      setLoading(false);
    })();
  }, [userId, open]);

  const memberSince = data?.created_at ? new Date(data.created_at).getFullYear() : null;
  const name = data?.display_name || data?.username || 'לומד';
  const rank = data ? getRankTitle(data.points) : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl" dir="rtl">
        <DialogHeader className="text-center pb-2">
          <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-elegant">
            {data?.avatar_url ? (
              <img src={data.avatar_url} alt={name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-primary-foreground">{name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <DialogTitle className="text-xl font-display font-bold">
            {loading ? 'טוען...' : name}
          </DialogTitle>
          {data && (
            <div className="flex flex-col items-center gap-1 mt-1">
              <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-full px-3 py-1 font-semibold">
                <Trophy className="w-3.5 h-3.5" /> {rank}
              </span>
              {memberSince && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> חבר מאז {memberSince}
                </p>
              )}
            </div>
          )}
        </DialogHeader>

        {data && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-2xl mb-1">💰</p>
              <p className="text-lg font-bold">{data.coins}</p>
              <p className="text-[10px] text-muted-foreground">מטבעות</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-2xl mb-1">💎</p>
              <p className="text-lg font-bold">{data.diamonds}</p>
              <p className="text-[10px] text-muted-foreground">יהלומים</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-2xl mb-1">✨</p>
              <p className="text-lg font-bold">{data.points}</p>
              <p className="text-[10px] text-muted-foreground">XP</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PublicProfileDialog;
