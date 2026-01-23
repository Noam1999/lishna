import { Trophy, Flame, BookOpen, Calendar, BarChart3 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FriendWithProfile } from '@/hooks/useFriends';
import { useProfile } from '@/hooks/useProfile';
import { useState } from 'react';

interface FriendProfileDialogProps {
  friend: FriendWithProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FriendProfileDialog = ({ friend, open, onOpenChange }: FriendProfileDialogProps) => {
  const { profile: myProfile } = useProfile();
  const [showComparison, setShowComparison] = useState(false);
  
  const friendProfile = friend.profile;
  const memberSince = friendProfile?.created_at 
    ? new Date(friendProfile.created_at).getFullYear() 
    : new Date().getFullYear();

  const stats = [
    { 
      icon: Trophy, 
      label: 'נקודות', 
      value: friendProfile?.points || 0,
      myValue: myProfile?.points || 0,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    { 
      icon: Flame, 
      label: 'רצף ימים', 
      value: friendProfile?.streak || 0,
      myValue: myProfile?.streak || 0,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    { 
      icon: BookOpen, 
      label: 'מילים נלמדו', 
      value: friendProfile?.words_mastered || 0,
      myValue: myProfile?.words_mastered || 0,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl" dir="rtl">
        <DialogHeader className="text-center pb-2">
          {/* Avatar */}
          <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-elegant">
            {friendProfile?.avatar_url ? (
              <img 
                src={friendProfile.avatar_url} 
                alt="Avatar" 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-primary-foreground">
                {(friendProfile?.display_name || 'U')[0].toUpperCase()}
              </span>
            )}
          </div>
          
          <DialogTitle className="text-xl font-display font-bold text-foreground">
            {friendProfile?.display_name || 'לומד'}
          </DialogTitle>
          
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            <Calendar className="w-4 h-4" />
            חבר מאז {memberSince}
          </p>
        </DialogHeader>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 my-4">
          {stats.map(({ icon: Icon, label, value, color, bgColor }) => (
            <div 
              key={label}
              className="bg-muted/50 rounded-xl p-3 text-center"
            >
              <div className={`w-8 h-8 mx-auto mb-1 rounded-full ${bgColor} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-lg font-bold text-foreground">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Comparison Section */}
        {showComparison && myProfile && (
          <div className="bg-muted/30 rounded-xl p-4 mb-4 animate-fade-in">
            <h4 className="font-semibold text-foreground mb-3 text-center">השוואת נתונים</h4>
            <div className="space-y-3">
              {stats.map(({ icon: Icon, label, value, myValue, color }) => {
                const iAmWinning = myValue > value;
                const tie = myValue === value;
                
                return (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className="text-muted-foreground">{label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-medium ${iAmWinning && !tie ? 'text-green-600' : 'text-foreground'}`}>
                        {myValue} (אני)
                      </span>
                      <span className="text-muted-foreground">vs</span>
                      <span className={`font-medium ${!iAmWinning && !tie ? 'text-green-600' : 'text-foreground'}`}>
                        {value}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Compare Button */}
        <Button
          variant={showComparison ? "secondary" : "outline"}
          onClick={() => setShowComparison(!showComparison)}
          className="w-full rounded-xl"
        >
          <BarChart3 className="w-4 h-4 ml-2" />
          {showComparison ? 'הסתר השוואה' : 'השוואת נתונים'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default FriendProfileDialog;
