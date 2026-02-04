import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SeasonHistoryItemProps {
  weekNumber: number;
  year: number;
  rank: number;
  points: number;
}

const SeasonHistoryItem = ({
  weekNumber,
  year,
  rank,
  points
}: SeasonHistoryItemProps) => {
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-500';
    return 'text-muted-foreground';
  };

  const getRankBg = (rank: number) => {
    if (rank <= 3) return 'bg-primary/5';
    return 'bg-card';
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl',
        getRankBg(rank)
      )}
    >
      {/* Trophy icon */}
      <div className={cn('p-2 rounded-full bg-muted', getRankColor(rank))}>
        <Trophy className="w-5 h-5" />
      </div>

      {/* Season info */}
      <div className="flex-1">
        <p className="font-semibold">שבוע {weekNumber}</p>
        <p className="text-xs text-muted-foreground">{year}</p>
      </div>

      {/* Rank and Points */}
      <div className="text-left">
        <p className={cn('font-bold', getRankColor(rank))}>
          מקום #{rank}
        </p>
        <p className="text-xs text-muted-foreground">{points} נקודות</p>
      </div>
    </div>
  );
};

export default SeasonHistoryItem;
