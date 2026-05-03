import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUserRole = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
    setRoles((data || []).map((r: { role: string }) => r.role));
    setLoading(false);
  };

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const becomeTeacher = async () => {
    if (!user) return { error: new Error('not signed in') };
    const { error } = await supabase.from('user_roles').insert({ user_id: user.id, role: 'teacher' as const });
    if (!error) await refetch();
    return { error };
  };

  return {
    roles,
    isTeacher: roles.includes('teacher'),
    isAdmin: roles.includes('admin'),
    loading,
    becomeTeacher,
    refetch,
  };
};
