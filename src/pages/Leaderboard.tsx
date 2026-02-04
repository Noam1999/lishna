import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Trophy, Medal, Users, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAchievements } from '@/hooks/useAchievements';
import LeaderboardEntry from '@/components/LeaderboardEntry';
import AchievementBadge from '@/components/AchievementBadge';
import SeasonHistoryItem from '@/components/SeasonHistoryItem';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Leaderboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'global' | 'friends'>('global');
  const { 
    globalLeaderboard, 
    friendsLeaderboard, 
    userRank, 
    seasonHistory,
    loading: leaderboardLoading 
  } = useLeaderboard();
  const { achievements, loading: achievementsLoading } = useAchievements();

  const currentLeaderboard = activeTab === 'global' ? globalLeaderboard : friendsLeaderboard;

  // Get current week number
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const currentWeek = getWeekNumber(new Date());

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-4 pb-24 flex flex-col items-center justify-center">
        <Trophy className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">התחבר כדי לראות את הלידרבורד</h2>
        <Button onClick={() => navigate('/auth')}>התחברות</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="bg-gradient-hero text-primary-foreground p-6 pb-8 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-primary-foreground hover:bg-white/20"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold font-display">ליגת המנצחים</h1>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Trophy className="w-6 h-6" />
          <span className="text-lg">שבוע {currentWeek}</span>
        </div>
      </div>

      {/* Leaderboard Toggle */}
      <div className="px-4 -mt-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'global' | 'friends')}>
          <TabsList className="w-full grid grid-cols-2 shadow-elegant">
            <TabsTrigger value="global" className="gap-2">
              <Globe className="w-4 h-4" />
              עולמי
            </TabsTrigger>
            <TabsTrigger value="friends" className="gap-2">
              <Users className="w-4 h-4" />
              חברים
            </TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="mt-4">
            <LeaderboardList 
              entries={globalLeaderboard} 
              loading={leaderboardLoading}
              currentUserId={user.id}
            />
          </TabsContent>

          <TabsContent value="friends" className="mt-4">
            {friendsLeaderboard.length === 0 && !leaderboardLoading ? (
              <Card className="text-center py-8">
                <CardContent>
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">אין לך חברים עדיין</p>
                  <Button 
                    variant="link" 
                    onClick={() => navigate('/friends')}
                    className="mt-2"
                  >
                    מצא חברים חדשים
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <LeaderboardList 
                entries={friendsLeaderboard} 
                loading={leaderboardLoading}
                currentUserId={user.id}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Achievements Section */}
      <div className="px-4 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="w-5 h-5 text-primary" />
              הישגים ותגים
            </CardTitle>
          </CardHeader>
          <CardContent>
            {achievementsLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-32 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {achievements.map(achievement => (
                  <AchievementBadge
                    key={achievement.id}
                    icon={achievement.icon}
                    name={achievement.name}
                    description={achievement.description}
                    unlocked={achievement.unlocked}
                    unlockedAt={achievement.unlockedAt}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Season History */}
      {seasonHistory.length > 0 && (
        <div className="px-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                עונות קודמות
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {seasonHistory.map(season => (
                <SeasonHistoryItem
                  key={season.id}
                  weekNumber={season.week_number}
                  year={season.year}
                  rank={season.final_rank}
                  points={season.final_points}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sticky Footer - Current User Rank */}
      {userRank && (
        <div className="fixed bottom-16 left-0 right-0 bg-card border-t border-border shadow-elegant p-3 z-40">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
              #{userRank.rank}
            </div>
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarImage src={userRank.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {(userRank.display_name || 'א').charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-primary">
                {userRank.display_name || userRank.username || 'אתה'}
              </p>
              <p className="text-xs text-muted-foreground">המיקום שלך השבוע</p>
            </div>
            <div className="text-left">
              <p className="font-bold text-lg text-primary">{userRank.weekly_points}</p>
              <p className="text-xs text-muted-foreground">נקודות</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Leaderboard List Component
const LeaderboardList = ({ 
  entries, 
  loading, 
  currentUserId 
}: { 
  entries: any[]; 
  loading: boolean;
  currentUserId: string;
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2">
        {entries.map(entry => (
          <LeaderboardEntry
            key={entry.id}
            rank={entry.rank}
            displayName={entry.display_name}
            username={entry.username}
            avatarUrl={entry.avatar_url}
            points={entry.weekly_points}
            isCurrentUser={entry.user_id === currentUserId}
          />
        ))}
      </div>
    </ScrollArea>
  );
};

export default Leaderboard;
