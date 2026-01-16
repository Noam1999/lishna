import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface DictionaryWord {
  id: number;
  aramaic: string;
  hebrew: string;
  type: 'פועל' | 'שם עצם' | 'תואר' | 'מילת יחס';
  culturalContext: string;
  learned: boolean;
}

const initialDictionary: DictionaryWord[] = [
  { id: 1, aramaic: 'אֲזַל', hebrew: 'הָלַךְ', type: 'פועל', culturalContext: 'מילת יסוד בתלמוד המתארת תנועה פיזית או התקדמות בסוגיה', learned: false },
  { id: 2, aramaic: 'אֲתָא', hebrew: 'בָּא', type: 'פועל', culturalContext: 'משמשת גם במשמעות של הגעה רוחנית או הבנה', learned: false },
  { id: 3, aramaic: 'בָּעָא', hebrew: 'שָׁאַל / רָצָה', type: 'פועל', culturalContext: 'מציינת שאלה הלכתית או בקשה בתפילה', learned: false },
  { id: 4, aramaic: 'יְתֵיב', hebrew: 'יָשַׁב', type: 'פועל', culturalContext: 'ישיבה ללימוד תורה, מקור השם "ישיבה"', learned: false },
  { id: 5, aramaic: 'חֲזָא', hebrew: 'רָאָה', type: 'פועל', culturalContext: 'ראייה חזותית או הבנה פנימית עמוקה', learned: false },
  { id: 6, aramaic: 'אֲמַר', hebrew: 'אָמַר', type: 'פועל', culturalContext: 'הפתיחה הנפוצה ביותר בתלמוד לציטוט חכמים', learned: false },
  { id: 7, aramaic: 'תָּנָא', hebrew: 'שָׁנָה / לִימֵּד', type: 'פועל', culturalContext: 'תנאים - חכמי המשנה ששנו את ההלכות בעל פה', learned: false },
  { id: 8, aramaic: 'קָאֵי', hebrew: 'עוֹמֵד', type: 'פועל', culturalContext: 'עמידה בתפילה או בהקשר של מצב קיים', learned: false },
  { id: 9, aramaic: 'נָפֵיק', hebrew: 'יָצָא', type: 'פועל', culturalContext: 'יציאה פיזית או לימוד הנגזר מפסוק', learned: false },
  { id: 10, aramaic: 'עָבֵיד', hebrew: 'עָשָׂה', type: 'פועל', culturalContext: 'עשיית מצווה או פעולה מעשית', learned: false },
  { id: 11, aramaic: 'גְּמָרָא', hebrew: 'לִימוּד / מַסְקָנָה', type: 'שם עצם', culturalContext: 'שם כולל לתלמוד הבבלי, מלשון גמר - השלמה', learned: false },
  { id: 12, aramaic: 'סוּגְיָא', hebrew: 'נוֹשֵׂא / עִנְיָן', type: 'שם עצם', culturalContext: 'יחידת לימוד בסיסית בתלמוד', learned: false },
  { id: 13, aramaic: 'הֵיכָא', hebrew: 'אֵיפֹה', type: 'מילת יחס', culturalContext: 'מילת שאלה נפוצה בדיונים תלמודיים', learned: false },
  { id: 14, aramaic: 'מַאי', hebrew: 'מָה', type: 'מילת יחס', culturalContext: 'פתיחה לשאלות יסוד בהבנת הסוגיה', learned: false },
  { id: 15, aramaic: 'הָכָא', hebrew: 'כָּאן', type: 'מילת יחס', culturalContext: 'מציין מקום בטקסט או בהקשר הנלמד', learned: false },
  { id: 16, aramaic: 'הָתָם', hebrew: 'שָׁם', type: 'מילת יחס', culturalContext: 'מפנה למקור אחר בתלמוד', learned: false },
  { id: 17, aramaic: 'רַבָּנָן', hebrew: 'חֲכָמִים', type: 'שם עצם', culturalContext: 'כינוי כבוד לחכמי התלמוד', learned: false },
  { id: 18, aramaic: 'מִילְּתָא', hebrew: 'דָּבָר / עִנְיָן', type: 'שם עצם', culturalContext: 'יחידת תוכן או טענה בדיון', learned: false },
  { id: 19, aramaic: 'שַׁפִּיר', hebrew: 'יָפֶה / טוֹב', type: 'תואר', culturalContext: 'ביטוי הסכמה או שבח לטיעון', learned: false },
  { id: 20, aramaic: 'קַשְׁיָא', hebrew: 'קָשֶׁה / קוּשְׁיָה', type: 'שם עצם', culturalContext: 'מציין סתירה או בעיה לוגית בסוגיה', learned: false },
];

interface DictionaryContextType {
  dictionary: DictionaryWord[];
  searchWord: (query: string, direction: 'hebrew-to-aramaic' | 'aramaic-to-hebrew') => DictionaryWord | null;
  markAsLearned: (id: number) => void;
  resetProgress: () => void;
  getUnlearnedWords: () => DictionaryWord[];
  quizScore: number;
  setQuizScore: React.Dispatch<React.SetStateAction<number>>;
  quizHistory: { word: DictionaryWord; correct: boolean }[];
  setQuizHistory: React.Dispatch<React.SetStateAction<{ word: DictionaryWord; correct: boolean }[]>>;
}

const DictionaryContext = createContext<DictionaryContextType | undefined>(undefined);

export const DictionaryProvider = ({ children }: { children: ReactNode }) => {
  const [dictionary, setDictionary] = useState<DictionaryWord[]>(initialDictionary);
  const [quizScore, setQuizScore] = useState(0);
  const [quizHistory, setQuizHistory] = useState<{ word: DictionaryWord; correct: boolean }[]>([]);

  const searchWord = (query: string, direction: 'hebrew-to-aramaic' | 'aramaic-to-hebrew'): DictionaryWord | null => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return null;

    return dictionary.find(word => {
      if (direction === 'hebrew-to-aramaic') {
        return word.hebrew.includes(normalizedQuery) || word.hebrew === normalizedQuery;
      } else {
        return word.aramaic.includes(normalizedQuery) || word.aramaic === normalizedQuery;
      }
    }) || null;
  };

  const markAsLearned = (id: number) => {
    setDictionary(prev =>
      prev.map(word =>
        word.id === id ? { ...word, learned: true } : word
      )
    );
  };

  const resetProgress = () => {
    setDictionary(prev =>
      prev.map(word => ({ ...word, learned: false }))
    );
  };

  const getUnlearnedWords = () => {
    return dictionary.filter(word => !word.learned);
  };

  return (
    <DictionaryContext.Provider value={{
      dictionary,
      searchWord,
      markAsLearned,
      resetProgress,
      getUnlearnedWords,
      quizScore,
      setQuizScore,
      quizHistory,
      setQuizHistory,
    }}>
      {children}
    </DictionaryContext.Provider>
  );
};

export const useDictionary = () => {
  const context = useContext(DictionaryContext);
  if (!context) {
    throw new Error('useDictionary must be used within a DictionaryProvider');
  }
  return context;
};
