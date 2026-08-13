import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { ArrowRight, Bug, Lightbulb, MessageCircle, ShieldX } from 'lucide-react';

interface FeedbackItem {
  id: string;
  feedback_type: string;
  message: string;
  email: string | null;
  user_id: string | null;
  created_at: string;
}

const typeConfig: Record<string, { label: string; icon: typeof Bug; color: string }> = {
  bug: { label: 'באג', icon: Bug, color: 'bg-destructive/10 text-destructive' },
  idea: { label: 'רעיון', icon: Lightbulb, color: 'bg-primary/10 text-primary' },
  general: { label: 'כללי', icon: MessageCircle, color: 'bg-muted text-muted-foreground' },
};

const AdminFeedback = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const checkAdminAndFetch = async () => {
      // Check admin role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin');

      if (!roles || roles.length === 0) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }
      setIsAdmin(true);

      // Fetch feedback (RLS will also enforce admin check)
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setFeedbackList(data);
        const ids = Array.from(new Set(data.map((f) => f.user_id).filter(Boolean))) as string[];
        if (ids.length) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('user_id, display_name')
            .in('user_id', ids);
          const map: Record<string, string> = {};
          (profs || []).forEach((p) => { map[p.user_id] = p.display_name || 'משתמש'; });
          setNames(map);
        }
      }
      setIsLoading(false);
    };
    checkAdminAndFetch();
  }, [user]);


  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4" dir="rtl">
        <ShieldX className="w-16 h-16 text-destructive" />
        <h2 className="text-xl font-bold text-foreground">אין הרשאה</h2>
        <p className="text-muted-foreground">דף זה מיועד למנהלים בלבד</p>
        <button onClick={() => navigate('/')} className="text-primary hover:underline text-sm">חזרה לדף הבית</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
            <ArrowRight className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">ניהול משובים</h1>
          <Badge variant="secondary" className="mr-auto">{feedbackList.length}</Badge>
        </div>

        {feedbackList.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              אין משובים עדיין
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {feedbackList.map((item) => {
              const config = typeConfig[item.feedback_type] || typeConfig.general;
              const Icon = config.icon;
              return (
                <Card key={item.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${config.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <Badge variant="outline">{config.label}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground whitespace-pre-wrap">{item.message}</p>
                    {item.email && (
                      <p className="text-xs text-muted-foreground mt-2">📧 {item.email}</p>
                    )}
                    {item.user_id && (
                      <p className="text-xs text-muted-foreground mt-1">🔑 {item.user_id.slice(0, 8)}...</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFeedback;
