import { Rss, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import ActivityCard from '@/components/ActivityCard';
import { Link } from 'react-router-dom';

const Feed = () => {
  const { user } = useAuth();
  const { activities, loading, celebrateActivity } = useActivityFeed();

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <Rss className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">עדכונים</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">ראה מה החברים שלך עושים</p>
      </div>

      <div className="px-6 mt-4 space-y-3">
        {!user ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-3">התחבר כדי לראות עדכונים מחברים</p>
            <Link
              to="/auth"
              className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
            >
              התחברות
            </Link>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-2xl p-4 border border-border animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <Rss className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-2">אין עדכונים עדיין</p>
            <p className="text-xs text-muted-foreground">
              הוסף חברים כדי לראות את הפעילות שלהם
            </p>
            <Link
              to="/friends"
              className="inline-block mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
            >
              מצא חברים
            </Link>
          </div>
        ) : (
          activities.map(activity => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onCelebrate={celebrateActivity}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Feed;
