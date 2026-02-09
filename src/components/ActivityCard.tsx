import { Heart, Flame, Brain, BookOpen } from 'lucide-react';
import { ActivityWithProfile } from '@/hooks/useActivityFeed';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface ActivityCardProps {
  activity: ActivityWithProfile;
  onCelebrate: (activityId: string) => void;
}

const getActivityContent = (activity: ActivityWithProfile) => {
  const name = activity.display_name || 'משתמש';
  const data = activity.activity_data || {};

  switch (activity.activity_type) {
    case 'quiz_completed': {
      const score = (data as Record<string, unknown>).score;
      const isPerfect = score === 100;
      return {
        icon: <Brain className="w-5 h-5 text-primary" />,
        text: isPerfect
          ? `${name} סיים מבחן עם ציון מושלם! 🎯`
          : `${name} סיים מבחן עם ציון ${score}%`,
      };
    }
    case 'streak_milestone': {
      const streak = (data as Record<string, unknown>).streak;
      return {
        icon: <Flame className="w-5 h-5 text-destructive" />,
        text: `${name} הגיע לרצף של ${streak} ימים! 🔥`,
      };
    }
    case 'words_milestone': {
      const count = (data as Record<string, unknown>).count;
      return {
        icon: <BookOpen className="w-5 h-5 text-primary" />,
        text: `${name} למד ${count} מילים חדשות היום! 📚`,
      };
    }
    default:
      return {
        icon: <BookOpen className="w-5 h-5 text-muted-foreground" />,
        text: `${name} היה פעיל`,
      };
  }
};

const getRelativeTime = (dateStr: string) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'עכשיו';
  if (diffMin < 60) return `לפני ${diffMin} דק'`;
  if (diffHours < 24) return `לפני ${diffHours} שע'`;
  if (diffDays < 7) return `לפני ${diffDays} ימים`;
  return date.toLocaleDateString('he-IL');
};

const ActivityCard = ({ activity, onCelebrate }: ActivityCardProps) => {
  const { icon, text } = getActivityContent(activity);

  return (
    <div className="bg-card rounded-2xl p-4 shadow-soft border border-border animate-fade-in">
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10 flex-shrink-0">
          {activity.avatar_url ? (
            <AvatarImage src={activity.avatar_url} alt={activity.display_name || ''} />
          ) : null}
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
            {(activity.display_name || 'U')[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {icon}
            <p className="text-sm text-foreground leading-relaxed">{text}</p>
          </div>
          <span className="text-xs text-muted-foreground">{getRelativeTime(activity.created_at)}</span>
        </div>
      </div>

      <div className="flex items-center justify-end mt-2 pt-2 border-t border-border">
        <button
          onClick={() => onCelebrate(activity.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            activity.user_celebrated
              ? 'bg-destructive/10 text-destructive'
              : 'bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
          }`}
        >
          <Heart
            className={`w-3.5 h-3.5 ${activity.user_celebrated ? 'fill-current' : ''}`}
          />
          <span>{activity.celebration_count > 0 ? activity.celebration_count : ''} חגיגה</span>
        </button>
      </div>
    </div>
  );
};

export default ActivityCard;
