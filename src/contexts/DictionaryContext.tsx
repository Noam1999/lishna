import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DictionaryWord {
  id: number;
  aramaic: string;
  hebrew: string;
  type:
    | 'פועל'
    | 'שם עצם'
    | 'תואר'
    | 'תואר הפועל'
    | 'מילת יחס'
    | 'מילת קישור'
    | 'מילת תנאי'
    | 'מילת שאלה'
    | 'מילת עזר'
    | 'מושג'
    | 'ביטוי';
  culturalContext: string;
  learned: boolean;
}

// Utility function to remove niqqud (vowel marks) for search
export const removeNiqqud = (text: string): string => {
  return text.normalize("NFD").replace(/[\u0591-\u05C7]/g, "");
};

const initialDictionary: DictionaryWord[] = [
  // Original words
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

  // מושגי יסוד ודמויות
  { id: 21, aramaic: 'תַּנָּא', hebrew: 'חכם מתקופת המשנה', type: 'מושג', culturalContext: 'התנאים היו חכמי ישראל שפעלו בתקופת המשנה, עד לחתימתה בידי רבי יהודה הנשיא', learned: false },
  { id: 22, aramaic: 'אָמוֹרָא', hebrew: 'חכם מתקופת הגמרא', type: 'מושג', culturalContext: 'האמוראים פירשו את דברי התנאים והרחיבו את ההלכה', learned: false },
  { id: 23, aramaic: 'בָּרַיְיתָא', hebrew: 'מקור תנאי שלא הוכנס למשנה', type: 'מושג', culturalContext: 'ברייתות משמשות כמקור משלים ללימוד המשנה', learned: false },
  { id: 24, aramaic: 'סוּגְיָא', hebrew: 'נושא או יחידת לימוד בגמרא', type: 'מושג', culturalContext: 'כל סוגיא עוסקת בנושא הלכתי מסוים ומנתחת אותו לעומק', learned: false },
  { id: 25, aramaic: 'שְׁמַע מִינַּהּ', hebrew: 'למד ממנה (מסקנה)', type: 'ביטוי', culturalContext: 'ביטוי המסכם מסקנה הלכתית מתוך דיון', learned: false },
  { id: 26, aramaic: 'תֵּיקוּ', hebrew: 'תעמוד (ספק ללא הכרעה)', type: 'מושג', culturalContext: 'ראשי תיבות: תשבי יתרץ קושיות ואבעיות - אליהו הנביא יפתור', learned: false },
  { id: 27, aramaic: 'הִלְכְתָא', hebrew: 'הלכה', type: 'מושג', culturalContext: 'ההכרעה המעשית בדין הלכתי', learned: false },
  { id: 28, aramaic: 'קוּשְׁיָא', hebrew: 'שאלה המצביעה על סתירה', type: 'מושג', culturalContext: 'קושיא חזקה יכולה להפוך דין או לחדד הבנה', learned: false },
  { id: 29, aramaic: 'תֵּירוּץ', hebrew: 'תשובה לקושיא', type: 'מושג', culturalContext: 'התירוץ מיישב את הסתירה ומשלים את הדיון', learned: false },
  { id: 30, aramaic: 'מֵימְרָא', hebrew: 'מאמר או דעה של אמורא', type: 'מושג', culturalContext: 'מימרות הן אמירות קצרות המביעות עמדה הלכתית או רעיונית', learned: false },

  // מילות קישור ומבנה הדיון
  { id: 31, aramaic: 'אִיכָּא', hebrew: 'יש', type: 'מילת יחס', culturalContext: 'מילה בסיסית לציון קיום או נוכחות', learned: false },
  { id: 32, aramaic: 'לֵיכָּא', hebrew: 'אין', type: 'מילת יחס', culturalContext: 'מילה לציון העדר או חוסר', learned: false },
  { id: 33, aramaic: 'אִיכָּא דְאָמְרִי', hebrew: 'יש אומרים', type: 'ביטוי', culturalContext: 'מציין דעה חולקת או גרסה אחרת', learned: false },
  { id: 34, aramaic: 'אֲנָא', hebrew: 'אני', type: 'מילת יחס', culturalContext: 'כינוי גוף ראשון יחיד', learned: false },
  { id: 35, aramaic: 'אִיהוּ', hebrew: 'הוא', type: 'מילת יחס', culturalContext: 'כינוי גוף שלישי יחיד זכר', learned: false },
  { id: 36, aramaic: 'אִיהִי', hebrew: 'היא', type: 'מילת יחס', culturalContext: 'כינוי גוף שלישי יחיד נקבה', learned: false },
  { id: 37, aramaic: 'אִינּוּן', hebrew: 'הם', type: 'מילת יחס', culturalContext: 'כינוי גוף שלישי רבים', learned: false },
  { id: 38, aramaic: 'הָכִי', hebrew: 'כך', type: 'מילת יחס', culturalContext: 'מציין אופן או דרך מסוימת', learned: false },
  { id: 39, aramaic: 'הֵיכִי', hebrew: 'איך', type: 'מילת יחס', culturalContext: 'מילת שאלה על אופן הפעולה', learned: false },
  { id: 40, aramaic: 'הָכָא', hebrew: 'כאן', type: 'מילת יחס', culturalContext: 'מציין מקום בטקסט הנלמד', learned: false },
  { id: 41, aramaic: 'הָתָם', hebrew: 'שם', type: 'מילת יחס', culturalContext: 'מפנה למקור אחר בתלמוד', learned: false },
  { id: 42, aramaic: 'מְנָא הָנֵי מִילֵּי', hebrew: 'מניין דברים אלו (מה המקור)', type: 'ביטוי', culturalContext: 'שאלה המבקשת מקור מהתורה להלכה', learned: false },
  { id: 43, aramaic: 'בִּשְׁלָמָא', hebrew: 'מובן הדבר', type: 'ביטוי', culturalContext: 'פתיחה להשוואה בין שיטות - מובן לפי שיטה אחת, אך קשה לפי אחרת', learned: false },
  { id: 44, aramaic: 'מַאי', hebrew: 'מה', type: 'מילת יחס', culturalContext: 'מילת שאלה בסיסית', learned: false },
  { id: 45, aramaic: 'מַאי שְׁנָא', hebrew: 'מה שונה', type: 'ביטוי', culturalContext: 'שאלה המבקשת להבין מדוע יש הבדל בין מקרים', learned: false },
  { id: 46, aramaic: 'אַמַּאי', hebrew: 'למה', type: 'מילת יחס', culturalContext: 'שאלה על הסיבה או הטעם', learned: false },
  { id: 47, aramaic: 'אַדְּרַבָּה', hebrew: 'להפך', type: 'ביטוי', culturalContext: 'טענה שהמסקנה צריכה להיות הפוכה', learned: false },
  { id: 48, aramaic: 'אִינִי', hebrew: 'האם כך הוא?', type: 'ביטוי', culturalContext: 'ביטוי תמיהה ופליאה', learned: false },
  { id: 49, aramaic: 'אִי הָכִי', hebrew: 'אם כך', type: 'ביטוי', culturalContext: 'פתיחה להסקת מסקנות מתוך הנחה', learned: false },

  // פעלים ופעולות
  { id: 50, aramaic: 'אָזֵיל', hebrew: 'הולך', type: 'פועל', culturalContext: 'צורה נוספת של הליכה בארמית', learned: false },
  { id: 51, aramaic: 'אָתֵי', hebrew: 'בא', type: 'פועל', culturalContext: 'צורה נוספת של ביאה', learned: false },
  { id: 52, aramaic: 'בָּעֵי', hebrew: 'שואל, מבקש או צריך', type: 'פועל', culturalContext: 'משמש בהקשרים שונים של שאילה ובקשה', learned: false },
  { id: 53, aramaic: 'חָזֵי', hebrew: 'רואה', type: 'פועל', culturalContext: 'ראייה או הבנה', learned: false },
  { id: 54, aramaic: 'יָהֵיב', hebrew: 'נתן', type: 'פועל', culturalContext: 'נתינה פיזית או מופשטת', learned: false },
  { id: 55, aramaic: 'יָתֵיב', hebrew: 'ישב', type: 'פועל', culturalContext: 'ישיבה ללימוד או למנוחה', learned: false },
  { id: 56, aramaic: 'מֵימַר', hebrew: 'לומר', type: 'פועל', culturalContext: 'שם הפועל של אמירה', learned: false },
  { id: 57, aramaic: 'נָפֵיק', hebrew: 'יצא', type: 'פועל', culturalContext: 'יציאה או הוצאה של מסקנה', learned: false },
  { id: 58, aramaic: 'עָבֵיד', hebrew: 'עשה', type: 'פועל', culturalContext: 'עשייה של מעשה או פעולה', learned: false },
  { id: 59, aramaic: 'צַלּוֹיֵי', hebrew: 'להתפלל', type: 'פועל', culturalContext: 'שם הפועל של תפילה', learned: false },
  { id: 60, aramaic: 'קָאֵי', hebrew: 'עומד', type: 'פועל', culturalContext: 'עמידה או מצב קיים', learned: false },
  { id: 61, aramaic: 'קַמַ"ל', hebrew: 'קא משמע לן (משמיע לנו)', type: 'ביטוי', culturalContext: 'ראשי תיבות המציינים חידוש הלכתי', learned: false },
  { id: 62, aramaic: 'רָמֵי', hebrew: 'הטיל (הצביע על סתירה)', type: 'פועל', culturalContext: 'הבאת שני מקורות סותרים לדיון', learned: false },
  { id: 63, aramaic: 'שָׁדַר', hebrew: 'שלח', type: 'פועל', culturalContext: 'שליחה של שליח או מכתב', learned: false },
  { id: 64, aramaic: 'תְּנֵי', hebrew: 'שנה/למד', type: 'פועל', culturalContext: 'לימוד משנה או ברייתא', learned: false },

  // מושגי זמן וכמות
  { id: 65, aramaic: 'הַשְׁתָּא', hebrew: 'עכשיו', type: 'מילת יחס', culturalContext: 'ציון הזמן הנוכחי', learned: false },
  { id: 66, aramaic: 'מֵעִיקָּרָא', hebrew: 'מהתחלה', type: 'מילת יחס', culturalContext: 'חזרה לנקודת ההתחלה של הדיון', learned: false },
  { id: 67, aramaic: 'לִמְחַר', hebrew: 'לעתיד לבוא או למחרת', type: 'מילת יחס', culturalContext: 'ציון זמן עתידי', learned: false },
  { id: 68, aramaic: 'אוֹרְתָא', hebrew: 'לילה', type: 'שם עצם', culturalContext: 'זמן הלילה', learned: false },
  { id: 69, aramaic: 'צַפְרָא', hebrew: 'בוקר', type: 'שם עצם', culturalContext: 'זמן הבוקר', learned: false },
  { id: 70, aramaic: 'יוֹמָא', hebrew: 'יום', type: 'שם עצם', culturalContext: 'יחידת זמן בסיסית, גם שם מסכת', learned: false },
  { id: 71, aramaic: 'שַׁתָּא', hebrew: 'שנה', type: 'שם עצם', culturalContext: 'יחידת זמן של שנה', learned: false },
  { id: 72, aramaic: 'תְּלָתִין', hebrew: 'שלושים', type: 'שם עצם', culturalContext: 'מספר שלושים', learned: false },
  { id: 73, aramaic: 'מְאָה', hebrew: 'מאה', type: 'שם עצם', culturalContext: 'מספר מאה', learned: false },
  { id: 74, aramaic: 'נָפִישׁ', hebrew: 'הרבה/מרובה', type: 'תואר', culturalContext: 'ציון כמות גדולה', learned: false },
  { id: 75, aramaic: 'זוּטָר', hebrew: 'קטן', type: 'תואר', culturalContext: 'ציון גודל קטן', learned: false },
  { id: 76, aramaic: 'פּוּרְתָא', hebrew: 'מעט', type: 'תואר', culturalContext: 'כמות מועטה', learned: false },
  { id: 77, aramaic: 'כּוּלֵּי עָלְמָא', hebrew: 'כל העולם (כולם מסכימים)', type: 'ביטוי', culturalContext: 'ציון הסכמה כללית בין החכמים', learned: false },
  { id: 78, aramaic: 'פַּלְגָא', hebrew: 'חצי', type: 'שם עצם', culturalContext: 'חלוקה לשניים', learned: false },
  { id: 79, aramaic: 'תְּרֵי', hebrew: 'שניים', type: 'שם עצם', culturalContext: 'מספר שניים', learned: false },

  // משפט, ממונות ואיסורים
  { id: 80, aramaic: 'פָּטוּר', hebrew: 'אינו חייב בעונש/תשלום', type: 'מושג', culturalContext: 'פטור מחיוב הלכתי', learned: false },
  { id: 81, aramaic: 'חַיָּיב', hebrew: 'מחויב בתשלום או עונש', type: 'מושג', culturalContext: 'חיוב הלכתי לשלם או לקבל עונש', learned: false },
  { id: 82, aramaic: 'מוּתָּר', hebrew: 'דבר שמותר לעשותו', type: 'מושג', culturalContext: 'היתר הלכתי', learned: false },
  { id: 83, aramaic: 'אָסוּר', hebrew: 'דבר שאין לעשותו', type: 'מושג', culturalContext: 'איסור הלכתי', learned: false },
  { id: 84, aramaic: 'דִּיעֲבַד', hebrew: 'לאחר מעשה', type: 'מושג', culturalContext: 'מצב שכבר נעשה, לעומת לכתחילה', learned: false },
  { id: 85, aramaic: 'לְכַתְּחִילָה', hebrew: 'הדרך הראויה מראש', type: 'מושג', culturalContext: 'הדרך הנכונה לפעול מלכתחילה', learned: false },
  { id: 86, aramaic: 'חֲזָקָה', hebrew: 'הנחה משפטית', type: 'מושג', culturalContext: 'הנחת יסוד שמשמשת בפסיקה', learned: false },
  { id: 87, aramaic: 'גּוֹזֵל', hebrew: 'לוקח בכוח', type: 'פועל', culturalContext: 'לקיחה בכפייה', learned: false },
  { id: 88, aramaic: 'גַּנָּב', hebrew: 'לוקח בסתר', type: 'שם עצם', culturalContext: 'גניבה בסתר לעומת גזילה בגלוי', learned: false },
  { id: 89, aramaic: 'מָמוֹנָא', hebrew: 'כסף/רכוש', type: 'שם עצם', culturalContext: 'דיני ממונות בתלמוד', learned: false },
  { id: 90, aramaic: 'נְכָסִים', hebrew: 'רכוש', type: 'שם עצם', culturalContext: 'נכסי מקרקעין או מטלטלין', learned: false },
  { id: 91, aramaic: 'הֶפְקֵר', hebrew: 'רכוש ללא בעלים', type: 'מושג', culturalContext: 'רכוש שניתן לכל אדם לזכות בו', learned: false },
  { id: 92, aramaic: 'יֵאוּשׁ', hebrew: 'ויתור של הבעלים על חפץ שאבד', type: 'מושג', culturalContext: 'מושג חשוב בדיני השבת אבידה', learned: false },
  { id: 93, aramaic: 'סָפֵק', hebrew: 'חוסר ודאות', type: 'מושג', culturalContext: 'מצב של אי-ודאות הלכתית', learned: false },
  { id: 94, aramaic: 'וַדַּאי', hebrew: 'מצב בטוח', type: 'מושג', culturalContext: 'מצב של ודאות מוחלטת', learned: false },

  // חיי יומיום וחפצים
  { id: 95, aramaic: 'בֵּיתָא', hebrew: 'בית', type: 'שם עצם', culturalContext: 'מקום המגורים', learned: false },
  { id: 96, aramaic: 'בַּר', hebrew: 'בן', type: 'שם עצם', culturalContext: 'בן או יליד של', learned: false },
  { id: 97, aramaic: 'בַּרְתָּא', hebrew: 'בת', type: 'שם עצם', culturalContext: 'בת', learned: false },
  { id: 98, aramaic: 'אִיתְּתָא', hebrew: 'אישה', type: 'שם עצם', culturalContext: 'אישה נשואה', learned: false },
  { id: 99, aramaic: 'גַּבְרָא', hebrew: 'איש/אדם', type: 'שם עצם', culturalContext: 'גבר או אדם באופן כללי', learned: false },
  { id: 100, aramaic: 'חַמְרָא', hebrew: 'יין או חמור', type: 'שם עצם', culturalContext: 'משמעות כפולה לפי הקשר', learned: false },
  { id: 101, aramaic: 'נַהֲמָא', hebrew: 'לחם', type: 'שם עצם', culturalContext: 'מזון בסיסי', learned: false },
  { id: 102, aramaic: 'מַיָּא', hebrew: 'מים', type: 'שם עצם', culturalContext: 'מים לשתייה או לטהרה', learned: false },
  { id: 103, aramaic: 'רִיפְתָּא', hebrew: 'פת לחם', type: 'שם עצם', culturalContext: 'פרוסת לחם', learned: false },
  { id: 104, aramaic: 'מָנָא', hebrew: 'כלי', type: 'שם עצם', culturalContext: 'כלי לשימושים שונים', learned: false },
  { id: 105, aramaic: 'מָאנֵי', hebrew: 'בגדים', type: 'שם עצם', culturalContext: 'בגדים או כלים', learned: false },
  { id: 106, aramaic: 'קַיְיטָא', hebrew: 'קיץ', type: 'שם עצם', culturalContext: 'עונת הקיץ', learned: false },
  { id: 107, aramaic: 'סִיתְוָא', hebrew: 'חורף', type: 'שם עצם', culturalContext: 'עונת החורף', learned: false },
  { id: 108, aramaic: 'אַרְעָא', hebrew: 'ארץ/קרקע', type: 'שם עצם', culturalContext: 'קרקע או אדמה', learned: false },
  { id: 109, aramaic: 'שׁוּקָא', hebrew: 'שוק', type: 'שם עצם', culturalContext: 'מקום מסחר ציבורי', learned: false },

  // ביטויים לוגיים נפוצים
  { id: 110, aramaic: 'דִּילְמָא', hebrew: 'שמא/אולי', type: 'ביטוי', culturalContext: 'הצגת אפשרות או חשש', learned: false },
  { id: 111, aramaic: 'כָּל שֶׁכֵּן', hebrew: 'קל וחומר', type: 'ביטוי', culturalContext: 'טיעון לוגי מהקל אל הכבד', learned: false },
  { id: 112, aramaic: 'תָּא שְׁמַע', hebrew: 'בוא ושמע (הבאת מקור)', type: 'ביטוי', culturalContext: 'פתיחה להבאת ראיה מטקסט', learned: false },
  { id: 113, aramaic: 'אֵיתִיבֵיהּ', hebrew: 'השיב לו (הקשה עליו)', type: 'ביטוי', culturalContext: 'הקשאה מתוך ברייתא או משנה', learned: false },
  { id: 114, aramaic: 'מַתְקֵיף', hebrew: 'מקשה קושיה הגיונית', type: 'פועל', culturalContext: 'הקשאה מסברא ולא מטקסט', learned: false },
  { id: 115, aramaic: 'גּוּפָא', hebrew: 'חוזרים לטקסט שהוזכר קודם', type: 'ביטוי', culturalContext: 'חזרה לעיון בטקסט שצוטט', learned: false },
  { id: 116, aramaic: 'לְעוֹלָם', hebrew: 'תשובה סופית המעמידה את הדברים', type: 'ביטוי', culturalContext: 'פתיחה לתירוץ שמיישב את הקושיא', learned: false },
  { id: 117, aramaic: 'מִשְּׁמֵיהּ', hebrew: 'משמו של', type: 'ביטוי', culturalContext: 'ציטוט בשם חכם אחר', learned: false },
  { id: 118, aramaic: 'סָלְקָא דַעְתָּךְ', hebrew: 'עלה על דעתך', type: 'ביטוי', culturalContext: 'מחשבה ראשונית שתידחה', learned: false },

  // פעלים חדשים (Verbs - Action)
  { id: 119, aramaic: 'שקיל', hebrew: 'לקח / נטל', type: 'פועל', culturalContext: 'לקיחה או נטילה של חפץ או עניין', learned: false },
  { id: 120, aramaic: 'שדי', hebrew: 'זרק / השליך', type: 'פועל', culturalContext: 'זריקה או השלכה', learned: false },
  { id: 121, aramaic: 'נפל', hebrew: 'נפל (קרה)', type: 'פועל', culturalContext: 'נפילה פיזית או התרחשות של אירוע', learned: false },
  { id: 122, aramaic: 'סליק', hebrew: 'עלה (או הוסר)', type: 'פועל', culturalContext: 'עלייה או הסרה מהדיון', learned: false },
  { id: 123, aramaic: 'נחית', hebrew: 'ירד', type: 'פועל', culturalContext: 'ירידה פיזית או ירידה לעומק הסוגיה', learned: false },
  { id: 124, aramaic: 'זבן', hebrew: 'מכר', type: 'פועל', culturalContext: 'מכירה בדיני ממונות', learned: false },
  { id: 125, aramaic: 'זבין', hebrew: 'קנה', type: 'פועל', culturalContext: 'קנייה בדיני ממונות', learned: false },
  { id: 126, aramaic: 'הדר', hebrew: 'חזר', type: 'פועל', culturalContext: 'חזרה לנקודה קודמת או חזרה בתשובה', learned: false },
  { id: 127, aramaic: 'קם', hebrew: 'עמד', type: 'פועל', culturalContext: 'קימה או עמידה', learned: false },
  { id: 128, aramaic: 'אכל', hebrew: 'אכל', type: 'פועל', culturalContext: 'אכילה, משמש גם במובן של ניצול', learned: false },
  { id: 129, aramaic: 'שתי', hebrew: 'שתה', type: 'פועל', culturalContext: 'שתייה', learned: false },
  { id: 130, aramaic: 'גני', hebrew: 'ישן / שכב', type: 'פועל', culturalContext: 'שינה או שכיבה', learned: false },
  { id: 131, aramaic: 'דמי', hebrew: 'דומה', type: 'פועל', culturalContext: 'דמיון בין דברים', learned: false },
  { id: 132, aramaic: 'סבר', hebrew: 'חשב (סברה)', type: 'פועל', culturalContext: 'חשיבה או סברה הגיונית', learned: false },
  { id: 133, aramaic: 'ידע', hebrew: 'ידע', type: 'פועל', culturalContext: 'ידיעה או הכרה', learned: false },

  // מילות קישור ויחס (Connectors)
  { id: 134, aramaic: 'כי', hebrew: 'כאשר / כמו', type: 'מילת יחס', culturalContext: 'מילת קישור לזמן או השוואה', learned: false },
  { id: 135, aramaic: 'לישנא', hebrew: 'לשון / שפה / נוסח', type: 'שם עצם', culturalContext: 'נוסח או גרסה של הטקסט', learned: false },
  { id: 136, aramaic: 'תוב', hebrew: 'שוב / עוד', type: 'מילת יחס', culturalContext: 'חזרה או תוספת', learned: false },
  { id: 137, aramaic: 'נמי', hebrew: 'גם', type: 'מילת יחס', culturalContext: 'תוספת או הכללה', learned: false },
  { id: 138, aramaic: 'אלא', hebrew: 'אלא / רק', type: 'מילת יחס', culturalContext: 'הגבלה או חריגה', learned: false },
  { id: 139, aramaic: 'אי', hebrew: 'אם', type: 'מילת יחס', culturalContext: 'תנאי', learned: false },
  { id: 140, aramaic: 'אי נמי', hebrew: 'או גם (אפשרות נוספת)', type: 'ביטוי', culturalContext: 'הצגת אפשרות חלופית', learned: false },
  { id: 141, aramaic: 'וכי', hebrew: 'וכי? (שאלת תמיהה)', type: 'ביטוי', culturalContext: 'שאלה רטורית של תמיהה', learned: false },
  { id: 142, aramaic: 'בתר', hebrew: 'אחרי', type: 'מילת יחס', culturalContext: 'ציון סדר כרונולוגי', learned: false },
  { id: 143, aramaic: 'קמי', hebrew: 'לפני', type: 'מילת יחס', culturalContext: 'ציון מיקום או זמן קודם', learned: false },
  { id: 144, aramaic: 'בהדי', hebrew: 'יחד עם / תוך כדי', type: 'מילת יחס', culturalContext: 'ציון פעולה משותפת או מקבילה', learned: false },
  { id: 145, aramaic: 'לגבי', hebrew: 'אצל / ביחס ל...', type: 'מילת יחס', culturalContext: 'ציון יחס או שייכות', learned: false },

  // משפחה ואנשים (Family & People)
  { id: 146, aramaic: 'אבא', hebrew: 'אבא', type: 'שם עצם', culturalContext: 'כינוי לאב, משמש גם כתואר לחכמים', learned: false },
  { id: 147, aramaic: 'אימא', hebrew: 'אמא', type: 'שם עצם', culturalContext: 'כינוי לאם', learned: false },
  { id: 148, aramaic: 'בריה', hebrew: 'הבן של...', type: 'שם עצם', culturalContext: 'בן, משמש לציון יוחסין', learned: false },
  { id: 149, aramaic: 'אחוה', hebrew: 'האח של...', type: 'שם עצם', culturalContext: 'אח, משמש לציון קרבת משפחה', learned: false },
  { id: 150, aramaic: 'סבא', hebrew: 'סב / זקן', type: 'שם עצם', culturalContext: 'סבא או זקן בעל חכמה', learned: false },
  { id: 151, aramaic: 'ינוקא', hebrew: 'ילד / תינוק', type: 'שם עצם', culturalContext: 'ילד קטן, לפעמים במשמעות של תלמיד צעיר מבריק', learned: false },
  { id: 152, aramaic: 'אינשי', hebrew: 'אנשים', type: 'שם עצם', culturalContext: 'אנשים באופן כללי', learned: false },
  { id: 153, aramaic: 'חתנא', hebrew: 'חתן', type: 'שם עצם', culturalContext: 'חתן, בעל הבת', learned: false },

  // טבע, עולם ובעלי חיים (Nature & Animals)
  { id: 154, aramaic: 'שמיא', hebrew: 'שמים', type: 'שם עצם', culturalContext: 'השמים, משמש גם ככינוי לה׳', learned: false },
  { id: 155, aramaic: 'ימא', hebrew: 'ים', type: 'שם עצם', culturalContext: 'ים, מקווה מים גדול', learned: false },
  { id: 156, aramaic: 'נהרא', hebrew: 'נהר', type: 'שם עצם', culturalContext: 'נהר, חשוב בדיני טהרה ומקוואות', learned: false },
  { id: 157, aramaic: 'נורא', hebrew: 'אש', type: 'שם עצם', culturalContext: 'אש, חשוב בדיני שבת ונזיקין', learned: false },
  { id: 158, aramaic: 'כלבא', hebrew: 'כלב', type: 'שם עצם', culturalContext: 'כלב, נזכר בדיני נזיקין', learned: false },
  { id: 159, aramaic: 'שונרא', hebrew: 'חתול', type: 'שם עצם', culturalContext: 'חתול', learned: false },
  { id: 160, aramaic: 'חיויא', hebrew: 'נחש', type: 'שם עצם', culturalContext: 'נחש, סמל לסכנה', learned: false },
  { id: 161, aramaic: 'גמלא', hebrew: 'גמל', type: 'שם עצם', culturalContext: 'גמל, בהמת משא נפוצה', learned: false },
  { id: 162, aramaic: 'סוסיא', hebrew: 'סוס', type: 'שם עצם', culturalContext: 'סוס', learned: false },
  { id: 163, aramaic: 'פניא', hebrew: 'ערב', type: 'שם עצם', culturalContext: 'זמן הערב, חשוב לזמני תפילה', learned: false },
  { id: 164, aramaic: 'ליליא', hebrew: 'לילה', type: 'שם עצם', culturalContext: 'זמן הלילה', learned: false },
  { id: 165, aramaic: 'שימשא', hebrew: 'שמש', type: 'שם עצם', culturalContext: 'השמש, חשוב לחישוב זמנים', learned: false },

  // גוף האדם (Body)
  { id: 166, aramaic: 'רישא', hebrew: 'ראש', type: 'שם עצם', culturalContext: 'ראש, גם במובן של התחלה או מנהיג', learned: false },
  { id: 167, aramaic: 'עינא', hebrew: 'עין', type: 'שם עצם', culturalContext: 'עין, גם במובן של מעיין מים', learned: false },
  { id: 168, aramaic: 'פומא', hebrew: 'פה', type: 'שם עצם', culturalContext: 'פה, חשוב בדיני נדרים ושבועות', learned: false },
  { id: 169, aramaic: 'ידא', hebrew: 'יד', type: 'שם עצם', culturalContext: 'יד, גם במובן של רשות או שליטה', learned: false },
  { id: 170, aramaic: 'כרעא', hebrew: 'רגל', type: 'שם עצם', culturalContext: 'רגל', learned: false },
  { id: 171, aramaic: 'ליבא', hebrew: 'לב', type: 'שם עצם', culturalContext: 'לב, מרכז הרגש והכוונה', learned: false },
  { id: 172, aramaic: 'דמא', hebrew: 'דם', type: 'שם עצם', culturalContext: 'דם, חשוב בדיני כשרות וטהרה', learned: false },

  // מילים חדשות - תוספת
  { id: 173, aramaic: 'אַבְדָּא', hebrew: 'עבד', type: 'שם עצם', culturalContext: 'עבד או משרת', learned: false },
  { id: 174, aramaic: 'אַגְרָא', hebrew: 'שכר', type: 'שם עצם', culturalContext: 'שכר או תשלום עבור עבודה או מצווה', learned: false },
  { id: 175, aramaic: 'אִדְּחִי', hebrew: 'נדחה', type: 'פועל', culturalContext: 'דחייה של טענה או דין', learned: false },
  { id: 176, aramaic: 'אַהֲדָדֵי', hebrew: 'זה עם זה', type: 'ביטוי', culturalContext: 'יחס הדדי בין שני צדדים', learned: false },
  { id: 177, aramaic: 'אוֹרְחָא', hebrew: 'דרך', type: 'שם עצם', culturalContext: 'דרך פיזית או דרך התנהגות', learned: false },
  { id: 178, aramaic: 'אַחֲרִינָא', hebrew: 'אחר', type: 'תואר', culturalContext: 'ציון דבר אחר או נוסף', learned: false },
  { id: 179, aramaic: 'אַטּוּ', hebrew: 'בגלל / וכי', type: 'מילת יחס', culturalContext: 'מילת שאלה רטורית או ציון סיבה', learned: false },
  { id: 180, aramaic: 'אֵימָא', hebrew: 'אגיד / אומר', type: 'פועל', culturalContext: 'צורת עתיד של אמירה - אגיד, נאמר', learned: false },
  { id: 181, aramaic: 'אֵימַת', hebrew: 'מתי', type: 'מילת יחס', culturalContext: 'מילת שאלה על זמן', learned: false },
  { id: 182, aramaic: 'אִית', hebrew: 'יש', type: 'מילת יחס', culturalContext: 'ציון קיום, נפוצה בארמית ארץ ישראלית', learned: false },
  { id: 183, aramaic: 'אִיתָא', hebrew: 'ישנו / קיים', type: 'מילת יחס', culturalContext: 'ציון קיום מודגש', learned: false },
  { id: 184, aramaic: 'אַלְמָא', hebrew: 'מכאן ש...', type: 'ביטוי', culturalContext: 'הסקת מסקנה מתוך דיון', learned: false },
  { id: 185, aramaic: 'אַנְתְּ', hebrew: 'אתה', type: 'מילת יחס', culturalContext: 'כינוי גוף שני יחיד', learned: false },
  { id: 186, aramaic: 'אֲפִילּוּ', hebrew: 'אפילו', type: 'מילת יחס', culturalContext: 'מילת הדגשה לכלול גם מקרה קיצוני', learned: false },
  { id: 187, aramaic: 'אַפְּקֵיהּ', hebrew: 'הוציא אותו', type: 'פועל', culturalContext: 'הוצאה של אדם או דבר', learned: false },
  { id: 188, aramaic: 'אַשְׁכַּח', hebrew: 'מצא', type: 'פועל', culturalContext: 'מציאה של דבר או מקור', learned: false },
  { id: 189, aramaic: 'אָתוּ', hebrew: 'באו', type: 'פועל', culturalContext: 'ביאה של רבים', learned: false },
  { id: 190, aramaic: 'בְּדִידִי', hebrew: 'בשלי / אצלי', type: 'מילת יחס', culturalContext: 'ציון שייכות עצמית', learned: false },
  { id: 191, aramaic: 'גַּבֵּי', hebrew: 'אצל', type: 'מילת יחס', culturalContext: 'ציון מיקום ליד מישהו', learned: false },
  { id: 192, aramaic: 'דָּא', hebrew: 'זו', type: 'מילת יחס', culturalContext: 'כינוי רמיזה לנקבה', learned: false },
  { id: 193, aramaic: 'דִּין', hebrew: 'זה', type: 'מילת יחס', culturalContext: 'כינוי רמיזה לזכר', learned: false },
  { id: 194, aramaic: 'דִּכְתִיב', hebrew: 'שכתוב', type: 'ביטוי', culturalContext: 'הפניה לפסוק מהתורה', learned: false },
  { id: 195, aramaic: 'דּוּכְתָּא', hebrew: 'מקום', type: 'שם עצם', culturalContext: 'ציון מקום פיזי או מקום בטקסט', learned: false },
  { id: 196, aramaic: 'הַאי', hebrew: 'הזה', type: 'מילת יחס', culturalContext: 'כינוי רמיזה מודגש', learned: false },
  { id: 197, aramaic: 'הַב', hebrew: 'תן', type: 'פועל', culturalContext: 'ציווי לתת', learned: false },
  { id: 198, aramaic: 'טְפֵי', hebrew: 'יותר', type: 'תואר', culturalContext: 'ציון עדיפות או כמות גדולה יותר', learned: false },
  { id: 199, aramaic: 'כְּמַאן', hebrew: 'כמו מי', type: 'ביטוי', culturalContext: 'שאלה לפי איזו שיטה נפסק', learned: false },
  { id: 200, aramaic: 'לָאו', hebrew: 'לא', type: 'מילת יחס', culturalContext: 'שלילה', learned: false },
  { id: 201, aramaic: 'לֵיהּ', hebrew: 'לו', type: 'מילת יחס', culturalContext: 'כינוי גוף שלישי יחיד עם מילת יחס', learned: false },
  { id: 202, aramaic: 'נָפְקָא מִינַּהּ', hebrew: 'מה יוצא מזה (ההבדל המעשי)', type: 'ביטוי', culturalContext: 'שאלה על המשמעות המעשית של מחלוקת', learned: false },

  // תוספת ביטויי גמרא נפוצים
  { id: 203, aramaic: 'בְּמַאי קָמִיפַּלְגִי', hebrew: 'במה הם חלוקים? (על מה הוויכוח?)', type: 'ביטוי', culturalContext: 'שאלה תלמודית קלאסית לבירור שורש המחלוקת בין החכמים', learned: false },
  { id: 204, aramaic: 'אִיבַּעְיָא לְהוּ', hebrew: 'נשאלה להם שאלה', type: 'ביטוי', culturalContext: 'פתיחה אופיינית להצגת שאלה הלכתית שלא הוכרעה', learned: false },
  { id: 205, aramaic: 'לָמָּה לִי', hebrew: 'בשביל מה זה נחוץ?', type: 'ביטוי', culturalContext: 'שאלה רטורית על נחיצות פרט מסוים בלשון המשנה או הברייתא', learned: false },
  { id: 206, aramaic: 'תַּנְיָא', hebrew: 'למדנו בברייתא (מקור חיצוני למשנה)', type: 'ביטוי', culturalContext: 'פתיחה להבאת ברייתא, מקור תנאי שלא נכלל במשנה', learned: false },
  { id: 207, aramaic: 'קָא מַשְׁמַע לָן', hebrew: 'בא להשמיע לנו (ללמד אותנו חידוש)', type: 'ביטוי', culturalContext: 'מציין את החידוש שהמשנה או הברייתא מבקשת ללמד', learned: false },
  { id: 208, aramaic: 'אִיתְּמַר', hebrew: 'נאמר (פתיחה לדברי אמוראים)', type: 'ביטוי', culturalContext: 'פתיחה להבאת מימרא של אמורא', learned: false },
  { id: 209, aramaic: 'סֵיפָא', hebrew: 'החלק האחרון / סוף', type: 'שם עצם', culturalContext: 'החלק האחרון של המשנה או הברייתא, לעומת הרישא', learned: false },

  // מילות סוגיה נפוצות — תוספת מאסטר
  { id: 210, aramaic: 'וְתוּ', hebrew: 'ועוד', type: 'מילת קישור', culturalContext: 'מוסיפה טענה או שאלה נוספת לדיון', learned: false },
  { id: 211, aramaic: 'שְׁנָא', hebrew: 'אמר', type: 'פועל', culturalContext: 'מופיעה בעיקר בצירוף "מאי שנא"', learned: false },
  { id: 212, aramaic: 'דְּתָנֵי', hebrew: 'ששנה', type: 'פועל', culturalContext: 'מציין מה ששנה התנא בברייתא או במשנה', learned: false },
  { id: 213, aramaic: 'בְּרֵישָׁא', hebrew: 'בראש', type: 'תואר הפועל', culturalContext: 'החלק הראשון של המשנה, לעומת הסיפא', learned: false },
  { id: 214, aramaic: 'אַקְרָא', hebrew: 'כתוב במקרא', type: 'פועל', culturalContext: 'הפניה אל הפסוק כמקור לדין', learned: false },
  { id: 215, aramaic: 'וְהָכִי', hebrew: 'וכך', type: 'מילת קישור', culturalContext: 'פתיחה להצגת ניסוח או הבנה מדויקת', learned: false },
  { id: 216, aramaic: 'קָתָנֵי', hebrew: 'שנינו', type: 'פועל', culturalContext: 'ציטוט מדויק של לשון המשנה', learned: false },
  { id: 217, aramaic: 'בְּסֵיפָא', hebrew: 'בסוף', type: 'תואר הפועל', culturalContext: 'החלק האחרון של המשנה או הברייתא', learned: false },
  { id: 218, aramaic: 'וְאִי', hebrew: 'ואם', type: 'מילת תנאי', culturalContext: 'פותחת אפשרות נוספת בדיון', learned: false },
  { id: 219, aramaic: 'אִי', hebrew: 'אם', type: 'מילת תנאי', culturalContext: 'מילת תנאי בסיסית בארמית תלמודית', learned: false },
  { id: 220, aramaic: 'בָּעֵית', hebrew: 'תרצה', type: 'פועל', culturalContext: 'מופיעה בצירוף "איבעית אימא" — אם תרצה אמור', learned: false },
  { id: 221, aramaic: 'יָלֵיף', hebrew: 'לומד / למד', type: 'פועל', culturalContext: 'לימוד דין ממקור אחר או מגזרה שווה', learned: false },
  { id: 222, aramaic: 'אֵימָא', hebrew: 'אמור', type: 'פועל', culturalContext: 'הצעת ניסוח חלופי לתירוץ הקושיה', learned: false },
  { id: 223, aramaic: 'לִתְנֵי', hebrew: 'לשנות', type: 'פועל', culturalContext: 'שאלה מדוע המשנה לא שנתה בלשון אחרת', learned: false },
  { id: 224, aramaic: 'הֲדַר', hebrew: 'חזר', type: 'פועל', culturalContext: 'חזרה בו של חכם מדבריו או חזרה לנושא', learned: false },
  { id: 225, aramaic: 'דְּקָאֵי', hebrew: 'שעומד', type: 'פועל', culturalContext: 'מציין את הנושא שבו עוסקת הסוגיה', learned: false },
  { id: 226, aramaic: 'מִילֵּי', hebrew: 'דברים / מילים', type: 'שם עצם', culturalContext: 'רבים של מילתא — דברים או עניינים', learned: false },
  { id: 227, aramaic: 'דְּכַפָּרָה', hebrew: 'שכפרה', type: 'שם עצם', culturalContext: 'הקשר של כפרה בקרבנות וביום הכיפורים', learned: false },
  { id: 228, aramaic: 'קָא', hebrew: 'בא / מילת עזר', type: 'מילת עזר', culturalContext: 'מילת עזר המציינת פעולה מתמשכת בהווה', learned: false },
  { id: 229, aramaic: 'אָכְלֵי', hebrew: 'אוכלים', type: 'פועל', culturalContext: 'מופיע בהקשרי תרומה, קרבנות וסעודה', learned: false },
  { id: 230, aramaic: 'וְהָא', hebrew: 'והרי', type: 'מילת קישור', culturalContext: 'פתיחה לקושיה מתוך מקור סותר', learned: false },
  { id: 231, aramaic: 'מְעַכְּבָא', hebrew: 'מעכבת', type: 'פועל', culturalContext: 'פעולה שבלעדיה המצווה או הקרבן פסולים', learned: false },
  { id: 232, aramaic: 'לָא מְעַכְּבָא', hebrew: 'לא מעכבת', type: 'ביטוי', culturalContext: 'החיסרון אינו פוסל את המעשה בדיעבד', learned: false },
  { id: 233, aramaic: 'כִּדְתַנְיָא', hebrew: 'כמו שכתוב בברייתא', type: 'ביטוי', culturalContext: 'הבאת ראיה מברייתא לתמיכה בטענה', learned: false },
  { id: 234, aramaic: 'בָּרַיְתָא', hebrew: 'משנה שלא נכנסה לששה סדרי משנה', type: 'שם עצם', culturalContext: 'מקור תנאי חיצוני למשנה שערך רבי', learned: false },
  { id: 235, aramaic: 'וּמִמַּאי', hebrew: 'ממה', type: 'מילת שאלה', culturalContext: 'שאלה על מקור ההוכחה של הטענה', learned: false },
  { id: 236, aramaic: 'מִלְתָא', hebrew: 'מילה', type: 'שם עצם', culturalContext: 'דבר, אמירה או עניין נידון', learned: false },
  { id: 237, aramaic: 'אוֹרְחֵיהּ', hebrew: 'דרכו', type: 'שם עצם', culturalContext: 'דרכו הרגילה של אדם או של הכתוב', learned: false },
  { id: 238, aramaic: 'לֵימָא', hebrew: 'נאמר', type: 'פועל', culturalContext: 'פתיחה להצעת הבנה או זיהוי שיטה', learned: false },
  { id: 239, aramaic: 'כִּדְאָמְרֵי', hebrew: 'כמו שאומרים', type: 'ביטוי', culturalContext: 'הבאת לשון מקובלת או פתגם', learned: false },
  { id: 240, aramaic: 'כִּדְאָמְרֵי אִינָשֵׁי', hebrew: 'כמו שאומרים אנשים', type: 'ביטוי', culturalContext: 'פתיחה לפתגם עממי המובא בתלמוד', learned: false },
  { id: 241, aramaic: 'שְׁמִיעַ', hebrew: 'שמעו', type: 'פועל', culturalContext: 'מופיע בצירוף "שמיע ליה" — שמע ממנו מסורת', learned: false },
];

interface DictionaryContextType {
  dictionary: DictionaryWord[];
  searchWord: (query: string, direction: 'hebrew-to-aramaic' | 'aramaic-to-hebrew') => DictionaryWord | null;
  getSuggestions: (query: string, direction: 'hebrew-to-aramaic' | 'aramaic-to-hebrew', limit?: number) => DictionaryWord[];
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

  // Fetch admin-managed words from DB and merge (kept live via realtime)
  const fetchCustomWords = useCallback(async () => {
    const { data, error } = await supabase.from('custom_words').select('*');
    if (error || !data) return;
    const maxId = Math.max(...initialDictionary.map((w) => w.id));
    const customWords: DictionaryWord[] = data.map((w) => ({
      id: maxId + 1000 + w.id,
      aramaic: w.aramaic,
      hebrew: w.hebrew,
      type: (w.word_type as DictionaryWord['type']) || 'שם עצם',
      culturalContext: w.cultural_context || '',
      learned: false,
    }));
    const customIds = new Set(customWords.map((w) => w.id));
    setDictionary((prev) => [
      ...prev.filter((w) => w.id <= maxId && !customIds.has(w.id)),
      ...customWords,
    ]);
  }, []);

  useEffect(() => {
    fetchCustomWords();
    const channel = supabase
      .channel('custom_words_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_words' }, () => {
        fetchCustomWords();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchCustomWords]);

  const searchWord = useCallback((query: string, direction: 'hebrew-to-aramaic' | 'aramaic-to-hebrew'): DictionaryWord | null => {
    const normalizedQuery = removeNiqqud(query.trim().toLowerCase());
    if (!normalizedQuery) return null;

    return dictionary.find(word => {
      if (direction === 'hebrew-to-aramaic') {
        const normalizedHebrew = removeNiqqud(word.hebrew.toLowerCase());
        return normalizedHebrew.includes(normalizedQuery) || normalizedHebrew === normalizedQuery;
      } else {
        const normalizedAramaic = removeNiqqud(word.aramaic.toLowerCase());
        return normalizedAramaic.includes(normalizedQuery) || normalizedAramaic === normalizedQuery;
      }
    }) || null;
  }, [dictionary]);

  const getSuggestions = useCallback((query: string, direction: 'hebrew-to-aramaic' | 'aramaic-to-hebrew', limit: number = 5): DictionaryWord[] => {
    const normalizedQuery = removeNiqqud(query.trim().toLowerCase());
    if (!normalizedQuery) return [];

    const matches = dictionary.filter(word => {
      if (direction === 'hebrew-to-aramaic') {
        const normalizedHebrew = removeNiqqud(word.hebrew.toLowerCase());
        return normalizedHebrew.includes(normalizedQuery);
      } else {
        const normalizedAramaic = removeNiqqud(word.aramaic.toLowerCase());
        return normalizedAramaic.includes(normalizedQuery);
      }
    });

    // Sort by relevance: exact matches first, then starts-with, then includes
    return matches
      .sort((a, b) => {
        const fieldA = direction === 'hebrew-to-aramaic' ? a.hebrew : a.aramaic;
        const fieldB = direction === 'hebrew-to-aramaic' ? b.hebrew : b.aramaic;
        const normA = removeNiqqud(fieldA.toLowerCase());
        const normB = removeNiqqud(fieldB.toLowerCase());

        // Exact match first
        if (normA === normalizedQuery && normB !== normalizedQuery) return -1;
        if (normB === normalizedQuery && normA !== normalizedQuery) return 1;

        // Starts with second
        if (normA.startsWith(normalizedQuery) && !normB.startsWith(normalizedQuery)) return -1;
        if (normB.startsWith(normalizedQuery) && !normA.startsWith(normalizedQuery)) return 1;

        // Alphabetical
        return normA.localeCompare(normB);
      })
      .slice(0, limit);
  }, [dictionary]);

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
      getSuggestions,
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
