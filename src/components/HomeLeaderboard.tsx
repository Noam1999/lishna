import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Skeleton } from '@/components/ui/skeleton';

const getMedalEmoji = (rank: number) => {
  switch (rank) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return null;
  }
};

const HomeLeaderboard = () => {
  const { globalLeaderboard, loading } = useLeaderboard();
  const top5 = globalLeaderboard.slice(0, 5);

  return (
    <div className="px-6 mt-6">
      <div className="bg-card rounded-2xl p-5 shadow-elegant border border-border">
        <div className="flex items-center justify-between mb-4">
          <Link to="/leaderboard" className="text-xs text-primary font-medium hover:underline">
            הצג הכל ←
          </Link>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">טבלת מובילים</h3>
            <Trophy className="w-5 h-5 text-primary" />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : top5.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">אין נתונים עדיין</p>
        ) : (
          <div className="space-y-2">
            {top5.map((entry) => {
              const name = entry.display_name || entry.username || 'משתמש';
              const medal = getMedalEmoji(entry.rank || 0);
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                    {medal || entry.rank}
                  </div>
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src={entry.avatar_url || undefined} alt={name} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-sm font-medium text-foreground truncate text-right">
                    {name}
                  </span>
                  <span className="text-sm font-bold text-primary">{entry.weekly_points}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeLeaderboard;
