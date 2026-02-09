import { Flame, Gift, CheckCircle2, Trophy } from 'lucide-react';
import { useDailyQuests, getQuestLabel } from '@/hooks/useDailyQuests';
import { useAuth } from '@/contexts/AuthContext';

const DailyQuests = () => {
  const { user } = useAuth();
  const { quests, loading, justClaimed, claimReward } = useDailyQuests();

  if (!user || loading || quests.length === 0) return null;

  const completedCount = quests.filter(q => q.completed).length;

  return (
    <div className="px-6 mb-6">
      <div className="bg-card rounded-2xl p-5 shadow-elegant border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">משימות יומיות</span>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {completedCount}/{quests.length} הושלמו
          </span>
        </div>

        <div className="space-y-3">
          {quests.map((quest) => {
            const { label, icon } = getQuestLabel(quest.quest_type);
            const progress = Math.min((quest.current_value / quest.target_value) * 100, 100);
            const isJustClaimed = justClaimed === quest.id;

            return (
              <div
                key={quest.id}
                className={`relative rounded-xl p-3 border transition-all duration-300 ${
                  quest.completed
                    ? quest.claimed
                      ? 'bg-muted/50 border-border opacity-70'
                      : 'bg-primary/5 border-primary/20'
                    : 'bg-card border-border'
                }`}
              >
                {/* Chest animation overlay */}
                {isJustClaimed && (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-xl animate-fade-in z-10">
                    <div className="text-center animate-scale-in">
                      <Trophy className="w-8 h-8 text-primary mx-auto mb-1" />
                      <span className="text-sm font-bold text-primary">+{quest.bonus_xp} XP!</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <span className="text-xl">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground truncate">{label}</span>
                      <span className="text-xs text-muted-foreground mr-2">
                        {quest.current_value}/{quest.target_value}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-l from-primary to-primary/70 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {quest.completed && !quest.claimed && (
                    <button
                      onClick={() => claimReward(quest.id)}
                      className="flex-shrink-0 w-9 h-9 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:bg-primary/90 transition-colors animate-scale-in"
                    >
                      <Gift className="w-4 h-4" />
                    </button>
                  )}

                  {quest.claimed && (
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DailyQuests;
