import { Link } from 'react-router-dom';
import { LogIn, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GuestLeaderboardOverlay = () => {
  return (
    <div className="relative mt-6">
      {/* Fake blurred leaderboard */}
      <div className="blur-sm pointer-events-none select-none space-y-3 px-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-card rounded-xl p-4 border border-border flex items-center gap-3">
            <span className="text-lg font-bold text-muted-foreground w-6">{i}</span>
            <div className="w-9 h-9 rounded-full bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 bg-muted rounded" />
              <div className="h-2 w-16 bg-muted rounded" />
            </div>
            <div className="h-4 w-12 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Overlay popup */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-card border border-border rounded-2xl shadow-elegant p-6 mx-6 text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-2">
            רוצה לראות איפה אתה מדורג בליגה?
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            התחבר עכשיו והתחל להתחרות!
          </p>
          <Button asChild className="w-full">
            <Link to="/auth">
              <LogIn className="w-4 h-4 ml-2" />
              התחבר עכשיו
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GuestLeaderboardOverlay;
