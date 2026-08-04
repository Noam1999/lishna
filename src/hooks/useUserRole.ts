import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const TEACHER_CODE = '8080';
const teacherKey = (uid: string) => `lishna:teacher:${uid}`;

export const useUserRole = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [localTeacher, setLocalTeacher] = useState(false);
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    if (!user) {
      setRoles([]);
      setLocalTeacher(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLocalTeacher(localStorage.getItem(teacherKey(user.id)) === '1');
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
    setRoles((data || []).map((r: { role: string }) => r.role));
    setLoading(false);
  };

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const becomeTeacherWithCode = async (code: string): Promise<{ ok: boolean }> => {
    if (!user) return { ok: false };
    // The access code is verified server-side; the role is granted there.
    const { data, error } = await supabase.rpc('claim_teacher_role', { _code: code.trim() });
    if (error || data !== true) return { ok: false };
    localStorage.setItem(teacherKey(user.id), '1');
    setLocalTeacher(true);
    await refetch();
    return { ok: true };
  };

  const isTeacher = roles.includes('teacher') || localTeacher;

  return {
    roles,
    isTeacher,
    isAdmin: roles.includes('admin'),
    loading,
    becomeTeacherWithCode,
    refetch,
  };
};
