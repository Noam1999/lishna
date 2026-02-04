import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface LeaderboardEntryProps {
  rank: number;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  points: number;
  isCurrentUser?: boolean;
}

const LeaderboardEntry = ({
  rank,
  displayName,
  username,
  avatarUrl,
  points,
  isCurrentUser = false
}: LeaderboardEntryProps) => {
  const getMedalStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900 shadow-lg shadow-yellow-200/50';
      case 2:
        return 'bg-gradient-to-br from-gray-200 to-gray-400 text-gray-700 shadow-lg shadow-gray-200/50';
      case 3:
        return 'bg-gradient-to-br from-orange-300 to-orange-500 text-orange-900 shadow-lg shadow-orange-200/50';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const name = displayName || username || 'משתמש';

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl transition-all duration-200',
        isCurrentUser 
          ? 'bg-primary/10 border-2 border-primary' 
          : 'bg-card hover:bg-accent/50',
        rank <= 3 && 'shadow-elegant'
      )}
    >
      {/* Rank */}
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm',
          getMedalStyle(rank)
        )}
      >
        {getMedalEmoji(rank) || rank}
      </div>

      {/* Avatar */}
      <Avatar className="h-12 w-12 border-2 border-background shadow-soft">
        <AvatarImage src={avatarUrl || undefined} alt={name} />
        <AvatarFallback className="bg-primary/20 text-primary font-semibold">
          {name.charAt(0)}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-semibold truncate',
          isCurrentUser && 'text-primary'
        )}>
          {name}
          {isCurrentUser && <span className="text-xs mr-1">(אתה)</span>}
        </p>
        {username && displayName && (
          <p className="text-xs text-muted-foreground truncate">@{username}</p>
        )}
      </div>

      {/* Points */}
      <div className="text-left">
        <p className="font-bold text-lg text-primary">{points}</p>
        <p className="text-xs text-muted-foreground">נקודות</p>
      </div>
    </div>
  );
};

export default LeaderboardEntry;
