import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';

interface AchievementBadgeProps {
  icon: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
}

const AchievementBadge = ({
  icon,
  name,
  description,
  unlocked,
  unlockedAt
}: AchievementBadgeProps) => {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center p-4 rounded-2xl transition-all duration-300',
        unlocked
          ? 'bg-gradient-to-br from-primary/10 to-accent/30 border-2 border-primary/30 shadow-elegant'
          : 'bg-muted/50 border-2 border-border grayscale opacity-60'
      )}
    >
      {/* Lock overlay for locked achievements */}
      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/40 rounded-2xl">
          <Lock className="w-6 h-6 text-muted-foreground" />
        </div>
      )}

      {/* Icon */}
      <div
        className={cn(
          'text-4xl mb-2',
          !unlocked && 'blur-[2px]'
        )}
      >
        {icon}
      </div>

      {/* Name */}
      <h4
        className={cn(
          'font-bold text-sm text-center',
          unlocked ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {name}
      </h4>

      {/* Description */}
      <p className="text-xs text-muted-foreground text-center mt-1">
        {description}
      </p>

      {/* Unlocked date */}
      {unlocked && unlockedAt && (
        <p className="text-xs text-primary mt-2">
          נפתח ב-{new Date(unlockedAt).toLocaleDateString('he-IL')}
        </p>
      )}
    </div>
  );
};

export default AchievementBadge;
