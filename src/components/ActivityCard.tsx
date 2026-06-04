import { Heart, Flame, Brain, BookOpen, Trophy, Megaphone } from 'lucide-react';
import { ActivityWithProfile } from '@/hooks/useActivityFeed';
import UserAvatar from '@/components/UserAvatar';

interface ActivityCardProps {
  activity: ActivityWithProfile;
  onCelebrate: (activityId: string) => void;
}

const getActivityContent = (activity: ActivityWithProfile) => {
  const name = activity.display_name || 'משתמש';
  const data = (activity.activity_data || {}) as Record<string, unknown>;

  switch (activity.activity_type) {
    case 'quiz_completed':
      return {
        icon: <Brain className="w-5 h-5 text-primary" />,
        text: data.score === 100
          ? `${name} סיים מבחן עם ציון מושלם! 🎯`
          : `${name} סיים מבחן עם ציון ${data.score}%`,
      };
    case 'streak_milestone':
      return {
        icon: <Flame className="w-5 h-5 text-destructive" />,
        text: `${name} הגיע לרצף של ${data.streak} ימים! 🔥`,
      };
    case 'words_milestone':
      return {
        icon: <BookOpen className="w-5 h-5 text-primary" />,
        text: `${name} למד ${data.count} מילים! 📚`,
      };
    case 'league_levelup':
      return {
        icon: <Trophy className="w-5 h-5 text-yellow-500" />,
        text: `${name} עלה ליגה! 🏆 דרגה ${data.rank ?? ''}`,
      };
    case 'system_update':
      return {
        icon: <Megaphone className="w-5 h-5 text-primary" />,
        text: `📣 ${data.title || 'עדכון מערכת'}${data.body ? ' — ' + data.body : ''}`,
      };
    default:
      return { icon: <BookOpen className="w-5 h-5 text-muted-foreground" />, text: `${name} היה פעיל` };
  }
};

const getRelativeTime = (dateStr: string) => {
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return 'עכשיו';
  if (diffMin < 60) return `לפני ${diffMin} דק'`;
  if (diffMin < 1440) return `לפני ${Math.floor(diffMin / 60)} שע'`;
  return new Date(dateStr).toLocaleDateString('he-IL');
};

const ActivityCard = ({ activity, onCelebrate }: ActivityCardProps) => {
  const { icon, text } = getActivityContent(activity);
  const isSystem = activity.activity_type === 'system_update';

  return (
    <div className={`rounded-2xl p-4 shadow-soft border animate-fade-in ${isSystem ? 'bg-primary/5 border-primary/30' : 'bg-card border-border'}`}>
      <div className="flex items-start gap-3">
        {isSystem ? (
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Megaphone className="w-5 h-5 text-primary" />
          </div>
        ) : (
          <UserAvatar userId={activity.user_id} size={40} />
        )}
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
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            activity.user_celebrated ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${activity.user_celebrated ? 'fill-current' : ''}`} />
          <span>{activity.celebration_count > 0 ? activity.celebration_count : ''} לייק</span>
        </button>
      </div>
    </div>
  );
};

export default ActivityCard;
