import { useState, useEffect } from 'react';
import { BarChart3, Users, BookOpen, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useDictionary } from '@/contexts/DictionaryContext';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const SiteStats = () => {
  const { dictionary, resetProgress } = useDictionary();
  const [profileCount, setProfileCount] = useState<number | null>(null);
  const [customWordCount, setCustomWordCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const [profiles, customWords] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('custom_words').select('id', { count: 'exact', head: true }),
      ]);
      setProfileCount(profiles.count ?? 0);
      setCustomWordCount(customWords.count ?? 0);
    };
    fetchStats();
  }, []);

  const handleReset = () => {
    resetProgress();
    toast.success('ההתקדמות אופסה (מקומי)');
  };

  const stats = [
    {
      label: 'מילים מובנות',
      value: dictionary.length,
      icon: BookOpen,
      color: 'text-primary',
    },
    {
      label: 'מילים מותאמות (DB)',
      value: customWordCount,
      icon: BookOpen,
      color: 'text-accent-foreground',
    },
    {
      label: 'משתמשים רשומים',
      value: profileCount,
      icon: Users,
      color: 'text-primary',
    },
  ];

  return (
    <div className="bg-card rounded-2xl p-5 shadow-soft border border-border space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">סטטיסטיקות האתר</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, i) => (
          <div key={i} className="bg-muted/50 rounded-xl p-3 text-center border border-border">
            <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
            <p className="text-xl font-bold text-foreground">
              {stat.value === null ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : stat.value}
            </p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-full gap-2">
            <AlertTriangle className="w-4 h-4" />
            איפוס כל ההתקדמות (מקומי)
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              פעולה זו תאפס את כל סטטוס הלמידה המקומי. לא ניתן לבטל.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>אפס</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SiteStats;
