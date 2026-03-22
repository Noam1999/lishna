import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import WordManager from './WordManager';
import SiteStats from './SiteStats';

const AdminPanel = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkAdmin = async () => {
    if (!user) return;
    setChecking(true);
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin',
      });
      if (error) throw error;
      setIsAdmin(!!data);
      if (data) setShowPanel(true);
    } catch {
      setIsAdmin(false);
    } finally {
      setChecking(false);
    }
  };

  if (!user) return null;

  if (!showPanel) {
    return (
      <div className="bg-card rounded-2xl p-5 shadow-soft border border-border">
        <Button
          onClick={checkAdmin}
          disabled={checking}
          variant="outline"
          className="w-full gap-2"
        >
          {checking ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Shield className="w-5 h-5" />
          )}
          כניסת מנהל
        </Button>
        {isAdmin === false && (
          <p className="text-sm text-destructive text-center mt-2">
            אין לך הרשאות מנהל
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-l from-primary/10 to-accent/10 rounded-2xl p-5 border border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h3 className="font-bold text-lg text-foreground">לוח בקרה למנהל</h3>
        </div>
        <WordManager />
      </div>
      <SiteStats />
    </div>
  );
};

export default AdminPanel;
