import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { getSkin, DEFAULT_SKIN_ID } from '@/lib/skins';
import { useAuth } from '@/contexts/AuthContext';
import { useAvatar, fetchUserSkin, getCachedUserSkin } from '@/contexts/AvatarContext';

interface UserAvatarProps {
  userId?: string | null;
  size?: number;
  className?: string;
  ring?: boolean;
  skinId?: string;
}

const UserAvatar = ({ userId, size = 40, className, ring = true, skinId }: UserAvatarProps) => {
  const { user } = useAuth();
  const { equipped } = useAvatar();
  const isMe = userId ? userId === user?.id : !userId;

  const [otherSkin, setOtherSkin] = useState<string>(() =>
    userId && !isMe ? getCachedUserSkin(userId) : DEFAULT_SKIN_ID,
  );

  useEffect(() => {
    if (!userId || isMe) return;
    let cancelled = false;
    fetchUserSkin(userId).then((s) => { if (!cancelled) setOtherSkin(s); });
    return () => { cancelled = true; };
  }, [userId, isMe]);

  const effectiveSkinId = skinId ?? (isMe ? equipped : otherSkin);
  const skin = getSkin(effectiveSkinId);
  const emojiSize = Math.round(size * 0.62);

  return (
    <div
      style={{ width: size, height: size, fontSize: emojiSize, lineHeight: 1 }}
      className={cn(
        'rounded-full bg-gradient-to-br flex items-center justify-center shadow-soft select-none overflow-hidden flex-shrink-0',
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
