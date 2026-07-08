import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, ShieldCheck } from 'lucide-react';

export type LegalDoc = 'terms' | 'privacy';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  doc: LegalDoc;
}

const PrivacyContent = () => (
  <div className="space-y-4 text-right text-sm leading-relaxed text-foreground/90" dir="rtl">
    <p className="text-xs text-muted-foreground">עדכון אחרון: 8.7.2026</p>
    <p>
      אנו ב"לישנא" מכבדים את הפרטיות של המשתמשים שלנו ומחויבים להגן על המידע האישי שנמסר לנו. מדיניות זו מפרטת כיצד אנו אוספים ומשתמשים במידע.
    </p>
    <section>
      <h3 className="font-bold text-foreground mb-1">המידע שנאסף</h3>
      <p>לצורך יצירת חשבון ושימוש באפליקציה, אנו אוספים כתובת אימייל, שם משתמש, ונתוני התקדמות לימודית (כגון הישגים במשחקים ודו-קרב). במקרה של התחברות דרך גוגל, נאסף רק המידע הבסיסי המאושר על ידי המשתמש (שם ואימייל).</p>
    </section>
    <section>
      <h3 className="font-bold text-foreground mb-1">השימוש במידע</h3>
      <p>המידע משמש אך ורק לצורך תפעול האפליקציה, שמירת התקדמות המשתמש, שיפור חוויית הלמידה והתאמת התכנים.</p>
    </section>
    <section>
      <h3 className="font-bold text-foreground mb-1">פרטיות קטינים ותלמידים</h3>
      <p>האפליקציה מיועדת לשימוש לימודי. ככל שהמשתמשים הם קטינים (מתחת לגיל 18), השימוש באפליקציה מותנה בהסכמת הורה, אפוטרופוס או מורה/מוסד חינוכי המאשר את הפעלת השירות עבורם.</p>
    </section>
    <section>
      <h3 className="font-bold text-foreground mb-1">אבטחת מידע</h3>
      <p>אנו מיישמים מערכות ונהלים מתקדמים לאבטחת מידע (באמצעות שרתי GitHub ו-Supabase המאובטחים). המידע נשמר בצורה מוצפנת ואינו מועבר, נמכר או משותף עם שום גורם צד שלישי למטרות מסחריות או פרסומיות.</p>
    </section>
    <section>
      <h3 className="font-bold text-foreground mb-1">זכויות המשתמש</h3>
      <p>כל משתמש (או הורה של משתמש קטין) רשאי לפנות אלינו בכל עת בבקשה לעיין במידע שנשמר, לתקנו או למחוק את החשבון והמידע לחלוטין מהמערכת.</p>
    </section>
    <p className="pt-2 border-t border-border text-muted-foreground">
      לפניות: <a href="mailto:playcom1999@gmail.com" className="text-primary underline">playcom1999@gmail.com</a>
    </p>
  </div>
);

const TermsContent = () => (
  <div className="space-y-4 text-right text-sm leading-relaxed text-foreground/90" dir="rtl">
    <p className="text-xs text-muted-foreground">עדכון אחרון: 8.7.2026</p>
    <p>ברוכים הבאים לאפליקציית "לישנא" (להלן: "האפליקציה"). השימוש באפליקציה כפוף להסכמה לתנאים הבאים:</p>
    <section>
      <h3 className="font-bold text-foreground mb-1">מהות השירות</h3>
      <p>"לישנא" היא פלטפורמה דיגיטלית לימודית לתרגול ושיפור מיומנויות שפה. השירות ניתן לשימוש אישי וחינוכי בלבד.</p>
    </section>
    <section>
      <h3 className="font-bold text-foreground mb-1">קניין רוחני</h3>
      <p>כל הזכויות באפליקציה, לרבות עיצוב, קוד מקור, תכנים, שאלות, מאגרי מידע, לוגואים וסימני מסחר, שמורות באופן בלעדי ליוצרי האפליקציה. אין להעתיק, לשכפל או להפיץ שום חלק מהאפליקציה ללא אישור מראש ובכתב.</p>
    </section>
    <section>
      <h3 className="font-bold text-foreground mb-1">שימוש הוגן ומותר</h3>
      <p>המשתמש מתחייב לעשות שימוש הוגן באפליקציה, לא לנסות לפרוץ, לשבש או להעמיס על שרתיה, ולא להשתמש בשפה בלתי הולמת או פוגענית במסגרת פיצ'רים אינטראקטיביים (כגון שמות משתמש או דו-קרב).</p>
    </section>
    <section>
      <h3 className="font-bold text-foreground mb-1">הגבלת אחריות</h3>
      <p>האפליקציה והתכנים שבה ניתנים לשימוש כפי שהם (As-Is). אנו עושים את מירב המאמצים להבטיח את דיוק התכנים ורציפות השירות, אך איננו אחראים לכל נזק, ישיר או עקיף, שעלול להיגרם כתוצאה משימוש באפליקציה או מתקלות טכניות זמניות.</p>
    </section>
    <section>
      <h3 className="font-bold text-foreground mb-1">שינויים בתנאים</h3>
      <p>אנו שומרים לעצמנו את הזכות לעדכן את תנאי השימוש ומדיניות הפרטיות מעת לעת. המשך השימוש באפליקציה לאחר עדכון התנאים ייחשב כהסכמה לתנאים החדשים.</p>
    </section>
    <p className="pt-2 border-t border-border text-muted-foreground">
      ניתן לפנות אלינו באמצעות מייל: <a href="mailto:playcom1999@gmail.com" className="text-primary underline">playcom1999@gmail.com</a>
      <br />
      ט.ל.ח — החברה יכולה לשנות את מדיניות הפרטיות או את תנאי השימוש בכל עת.
    </p>
  </div>
);

const LegalDialog = ({ open, onOpenChange, doc }: Props) => {
  const isPrivacy = doc === 'privacy';
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] p-0 overflow-hidden" dir="rtl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3 flex-row-reverse">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              {isPrivacy ? (
                <ShieldCheck className="w-5 h-5 text-primary" />
              ) : (
                <FileText className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="text-right flex-1">
              <DialogTitle className="text-lg font-bold">
                {isPrivacy ? 'מדיניות פרטיות' : 'תנאי שימוש'}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">אפליקציית לישנא</p>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] px-6 py-4">
          {isPrivacy ? <PrivacyContent /> : <TermsContent />}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default LegalDialog;
