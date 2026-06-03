import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { getSkin } from '@/lib/skins';
import { useAuth } from '@/contexts/AuthContext';
import { useAvatar, getUserEquippedSkin } from '@/contexts/AvatarContext';

interface UserAvatarProps {
  userId?: string | null;
  size?: number;          // px
  className?: string;
  ring?: boolean;
  skinId?: string;        // override
}

/**
 * Unified avatar showing the user's currently-equipped skin (stylized character)
 * instead of an initial letter. Reactive to skin changes for the current user.
 */
const UserAvatar = ({ userId, size = 40, className, ring = true, skinId }: UserAvatarProps) => {
  const { user } = useAuth();
  const { equipped } = useAvatar();
  const isMe = userId ? userId === user?.id : true;

  const [otherSkin, setOtherSkin] = useState<string>(() =>
    userId && !isMe ? getUserEquippedSkin(userId) : 'default',
  );

  useEffect(() => {
    if (!userId || isMe) return;
    const sync = () => setOtherSkin(getUserEquippedSkin(userId));
    sync();
    window.addEventListener('lishna:avatar:update', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('lishna:avatar:update', sync);
      window.removeEventListener('storage', sync);
    };
  }, [userId, isMe]);

  const effectiveSkinId = skinId ?? (isMe ? equipped : otherSkin);
  const skin = getSkin(effectiveSkinId);
  const emojiSize = Math.round(size * 0.62);

  return (
    <div
      style={{ width: size, height: size, fontSize: emojiSize, lineHeight: 1 }}
      className={cn(
        'rounded-full bg-gradient-to-br flex items-center justify-center shadow-soft select-none overflow-hidden',
        skin.bg,
        ring && `ring-2 ${skin.ring}`,
        className,
      )}
      aria-label={skin.name}
    >
      <span className="drop-shadow-sm" role="img">{skin.emoji}</span>
    </div>
  );
};

export default UserAvatar;
