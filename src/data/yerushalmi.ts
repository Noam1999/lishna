// Jerusalem Talmud (Vilna) index for the "לימוד חווייתי" feature.
import type { ShasMasechet, ShasSeder } from './shas';

const y = (id: string, label: string, sefaria: string, lastDaf: number): ShasMasechet => ({
  id,
  label,
  sefaria: sefaria ? `Jerusalem Talmud ${sefaria}` : '',
  lastDaf,
});

export const YERUSHALMI: ShasSeder[] = [
  {
    id: 'zeraim',
    label: 'סדר זרעים',
    masechtot: [
      y('berakhot', 'ברכות', 'Berakhot', 68),
      y('peah', 'פאה', 'Peah', 37),
      y('demai', 'דמאי', 'Demai', 34),
      y('kilayim', 'כלאים', 'Kilayim', 44),
      y('sheviit', 'שביעית', 'Sheviit', 31),
      y('terumot', 'תרומות', 'Terumot', 59),
      y('maasrot', 'מעשרות', 'Maasrot', 26),
      y('maaser-sheni', 'מעשר שני', 'Maaser Sheni', 31),
      y('challah', 'חלה', 'Challah', 28),
      y('orlah', 'ערלה', 'Orlah', 20),
      y('bikkurim', 'ביכורים', 'Bikkurim', 13),
    ],
  },
  {
    id: 'moed',
    label: 'סדר מועד',
    masechtot: [
      y('shabbat', 'שבת', 'Shabbat', 92),
      y('eruvin', 'עירובין', 'Eruvin', 65),
      y('pesachim', 'פסחים', 'Pesachim', 71),
      y('shekalim', 'שקלים', 'Shekalim', 33),
      y('yoma', 'יומא', 'Yoma', 42),
      y('sukkah', 'סוכה', 'Sukkah', 26),
      y('beitzah', 'ביצה', 'Beitzah', 22),
      y('rosh-hashanah', 'ראש השנה', 'Rosh Hashanah', 22),
      y('taanit', 'תענית', 'Taanit', 26),
      y('megillah', 'מגילה', 'Megillah', 34),
      y('chagigah', 'חגיגה', 'Chagigah', 22),
      y('moed-katan', 'מועד קטן', 'Moed Katan', 19),
    ],
  },
  {
    id: 'nashim',
    label: 'סדר נשים',
    masechtot: [
      y('yevamot', 'יבמות', 'Yevamot', 85),
      y('ketubot', 'כתובות', 'Ketubot', 72),
      y('nedarim', 'נדרים', 'Nedarim', 40),
      y('nazir', 'נזיר', 'Nazir', 47),
      y('sotah', 'סוטה', 'Sotah', 47),
      y('gittin', 'גיטין', 'Gittin', 54),
      y('kiddushin', 'קידושין', 'Kiddushin', 48),
    ],
  },
  {
    id: 'nezikin',
    label: 'סדר נזיקין',
    masechtot: [
      y('bava-kamma', 'בבא קמא', 'Bava Kamma', 40),
      y('bava-metzia', 'בבא מציעא', 'Bava Metzia', 37),
      y('bava-batra', 'בבא בתרא', 'Bava Batra', 34),
      y('sanhedrin', 'סנהדרין', 'Sanhedrin', 57),
      y('makkot', 'מכות', 'Makkot', 9),
      y('shevuot', 'שבועות', 'Shevuot', 44),
      y('avodah-zarah', 'עבודה זרה', 'Avodah Zarah', 45),
      y('horayot', 'הוריות', 'Horayot', 19),
    ],
  },
  {
    id: 'taharot',
    label: 'סדר טהרות',
    masechtot: [y('niddah', 'נדה', 'Niddah', 13)],
  },
];
