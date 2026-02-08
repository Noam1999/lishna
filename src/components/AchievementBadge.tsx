import { cn } from '@/lib/utils';
import { Lock, Sparkles } from 'lucide-react';
import { useState } from 'react';

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
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'relative flex flex-col items-center p-4 rounded-2xl transition-all duration-500 cursor-pointer overflow-hidden group',
        unlocked
          ? 'bg-gradient-to-br from-primary/10 via-accent/20 to-primary/10 border-2 border-primary/30 shadow-elegant hover:shadow-lg hover:scale-105 hover:border-primary/50'
          : 'bg-muted/50 border-2 border-border grayscale opacity-60 hover:opacity-80'
      )}
    >
      {/* Animated background glow for unlocked achievements */}
      {unlocked && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 animate-pulse" />
        </div>
      )}

      {/* Sparkle effects for unlocked achievements on hover */}
      {unlocked && isHovered && (
        <>
          <Sparkles className="absolute top-2 right-2 w-3 h-3 text-primary animate-ping" />
          <Sparkles className="absolute bottom-3 left-2 w-2 h-2 text-accent animate-ping" style={{ animationDelay: '0.2s' }} />
          <Sparkles className="absolute top-3 left-3 w-2 h-2 text-primary/70 animate-ping" style={{ animationDelay: '0.4s' }} />
        </>
      )}

      {/* Lock overlay for locked achievements */}
      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/40 rounded-2xl backdrop-blur-[1px]">
          <Lock className="w-6 h-6 text-muted-foreground animate-pulse" />
        </div>
      )}

      {/* Icon with animation */}
      <div
        className={cn(
          'text-4xl mb-2 transition-all duration-300 relative z-10',
          !unlocked && 'blur-[2px]',
          unlocked && 'group-hover:scale-110 group-hover:drop-shadow-lg'
        )}
      >
        {icon}
      </div>

      {/* Name with glow effect */}
      <h4
        className={cn(
          'font-bold text-sm text-center transition-all duration-300 relative z-10',
          unlocked ? 'text-foreground group-hover:text-primary' : 'text-muted-foreground'
        )}
      >
        {name}
      </h4>

      {/* Description */}
      <p className="text-xs text-muted-foreground text-center mt-1 relative z-10 transition-all duration-300 group-hover:text-muted-foreground/80">
        {description}
      </p>

      {/* Unlocked date with animation */}
      {unlocked && unlockedAt && (
        <p className="text-xs text-primary mt-2 relative z-10 flex items-center gap-1 transition-all duration-300 group-hover:font-medium">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          נפתח ב-{new Date(unlockedAt).toLocaleDateString('he-IL')}
        </p>
      )}

      {/* Bottom shine effect on hover */}
      {unlocked && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}
    </div>
  );
};

export default AchievementBadge;
