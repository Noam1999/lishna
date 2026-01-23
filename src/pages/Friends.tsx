import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Users, UserPlus, Check, X, 
  ChevronLeft, Trophy, Flame 
} from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useFriends, FriendWithProfile } from '@/hooks/useFriends';
import { Profile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import FriendProfileDialog from '@/components/FriendProfileDialog';

const Friends = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { friends, pendingRequests, loading, searchUsers, sendFriendRequest, acceptFriendRequest, rejectFriendRequest } = useFriends();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<FriendWithProfile | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    const results = await searchUsers(searchQuery);
    setSearchResults(results);
    setSearching(false);
  };

  const handleSendRequest = async (friendId: string) => {
    const { error } = await sendFriendRequest(friendId);
    if (error) {
      toast({
        title: 'שגיאה',
        description: 'לא הצלחנו לשלוח בקשת חברות',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'נשלח!',
        description: 'בקשת החברות נשלחה בהצלחה',
      });
      setSearchResults([]);
      setSearchQuery('');
    }
  };

  const handleAccept = async (friendshipId: string) => {
    const { error } = await acceptFriendRequest(friendshipId);
    if (!error) {
      toast({
        title: 'אושר!',
        description: 'החבר נוסף בהצלחה',
      });
    }
  };

  const handleReject = async (friendshipId: string) => {
    const { error } = await rejectFriendRequest(friendshipId);
    if (!error) {
      toast({
        title: 'נדחה',
        description: 'בקשת החברות נדחתה',
      });
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="חברים" subtitle="התחבר עם לומדים אחרים" />

      {/* Search Section */}
      <div className="px-6 mb-6">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="חפש חברים לפי שם..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pr-10 h-12 rounded-xl"
            />
          </div>
          <Button 
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            className="h-12 px-6 rounded-xl"
          >
            {searching ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              'חפש'
            )}
          </Button>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="px-6 mb-6">
          <h3 className="font-semibold text-foreground mb-3">תוצאות חיפוש</h3>
          <div className="space-y-2">
            {searchResults.map((profile) => (
              <div 
                key={profile.id}
                className="bg-card rounded-xl p-4 shadow-soft border border-border flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {(profile.display_name || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{profile.display_name || 'לומד'}</p>
                    <p className="text-xs text-muted-foreground">{profile.points} נקודות</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleSendRequest(profile.user_id)}
                  className="rounded-lg"
                >
                  <UserPlus className="w-4 h-4 ml-1" />
                  הוסף
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="px-6 mb-6">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            בקשות ממתינות ({pendingRequests.length})
          </h3>
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <div 
                key={request.id}
                className="bg-card rounded-xl p-4 shadow-soft border border-primary/20 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {(request.profile?.display_name || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{request.profile?.display_name || 'לומד'}</p>
                    <p className="text-xs text-muted-foreground">רוצה להיות חברים</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleAccept(request.id)}
                    className="w-8 h-8 rounded-full text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleReject(request.id)}
                    className="w-8 h-8 rounded-full text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="px-6">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          החברים שלי ({friends.length})
        </h3>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : friends.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 shadow-soft border border-border text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">עדיין אין לך חברים</p>
            <p className="text-sm text-muted-foreground">חפש לומדים אחרים והוסף אותם כחברים!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => setSelectedFriend(friend)}
                className="w-full bg-card rounded-xl p-4 shadow-soft border border-border flex items-center justify-between hover:shadow-elegant hover:border-primary/20 transition-all text-right"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary-foreground">
                      {(friend.profile?.display_name || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{friend.profile?.display_name || 'לומד'}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-yellow-500" />
                        {friend.profile?.points || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-500" />
                        {friend.profile?.streak || 0} ימים
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Friend Profile Dialog */}
      {selectedFriend && (
        <FriendProfileDialog
          friend={selectedFriend}
          open={!!selectedFriend}
          onOpenChange={(open) => !open && setSelectedFriend(null)}
        />
      )}
    </div>
  );
};

export default Friends;
