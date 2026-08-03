// Full Babylonian Talmud (Vilna) index for the "לימוד חווייתי" feature.

export interface ShasMasechet {
  /** Sefaria English name (used for the API call). Empty when there is no Bavli. */
  sefaria: string;
  id: string;
  label: string;
  /** Last daf (pages run 2a .. lastDaf b). 0 = no Babylonian Talmud. */
  lastDaf: number;
}

export interface ShasSeder {
  id: string;
  label: string;
  masechtot: ShasMasechet[];
}

const m = (id: string, label: string, sefaria: string, lastDaf: number): ShasMasechet => ({
  id,
  label,
  sefaria,
  lastDaf,
});

export const SHAS: ShasSeder[] = [
  {
    id: 'zeraim',
    label: 'סדר זרעים',
    masechtot: [
      m('berakhot', 'ברכות', 'Berakhot', 64),
      m('peah', 'פאה', '', 0),
      m('demai', 'דמאי', '', 0),
      m('kilayim', 'כלאים', '', 0),
      m('sheviit', 'שביעית', '', 0),
      m('terumot', 'תרומות', '', 0),
      m('maasrot', 'מעשרות', '', 0),
      m('maaser-sheni', 'מעשר שני', '', 0),
      m('challah', 'חלה', '', 0),
      m('orlah', 'ערלה', '', 0),
      m('bikkurim', 'ביכורים', '', 0),
    ],
  },
  {
    id: 'moed',
    label: 'סדר מועד',
    masechtot: [
      m('shabbat', 'שבת', 'Shabbat', 157),
      m('eruvin', 'עירובין', 'Eruvin', 105),
      m('pesachim', 'פסחים', 'Pesachim', 121),
      m('shekalim', 'שקלים', 'Shekalim', 22),
      m('yoma', 'יומא', 'Yoma', 88),
      m('sukkah', 'סוכה', 'Sukkah', 56),
      m('beitzah', 'ביצה', 'Beitzah', 40),
      m('rosh-hashanah', 'ראש השנה', 'Rosh Hashanah', 35),
      m('taanit', 'תענית', 'Taanit', 31),
      m('megillah', 'מגילה', 'Megillah', 32),
      m('moed-katan', 'מועד קטן', 'Moed Katan', 29),
      m('chagigah', 'חגיגה', 'Chagigah', 27),
    ],
  },
  {
    id: 'nashim',
    label: 'סדר נשים',
    masechtot: [
      m('yevamot', 'יבמות', 'Yevamot', 122),
      m('ketubot', 'כתובות', 'Ketubot', 112),
      m('nedarim', 'נדרים', 'Nedarim', 91),
      m('nazir', 'נזיר', 'Nazir', 66),
      m('sotah', 'סוטה', 'Sotah', 49),
      m('gittin', 'גיטין', 'Gittin', 90),
      m('kiddushin', 'קידושין', 'Kiddushin', 82),
    ],
  },
  {
    id: 'nezikin',
    label: 'סדר נזיקין',
    masechtot: [
      m('bava-kamma', 'בבא קמא', 'Bava Kamma', 119),
      m('bava-metzia', 'בבא מציעא', 'Bava Metzia', 119),
      m('bava-batra', 'בבא בתרא', 'Bava Batra', 176),
      m('sanhedrin', 'סנהדרין', 'Sanhedrin', 113),
      m('makkot', 'מכות', 'Makkot', 24),
      m('shevuot', 'שבועות', 'Shevuot', 49),
      m('eduyot', 'עדויות', '', 0),
      m('avodah-zarah', 'עבודה זרה', 'Avodah Zarah', 76),
      m('avot', 'אבות', '', 0),
      m('horayot', 'הוריות', 'Horayot', 14),
    ],
  },
  {
    id: 'kodashim',
    label: 'סדר קדשים',
    masechtot: [
      m('zevachim', 'זבחים', 'Zevachim', 120),
      m('menachot', 'מנחות', 'Menachot', 110),
      m('chullin', 'חולין', 'Chullin', 142),
      m('bekhorot', 'בכורות', 'Bekhorot', 61),
      m('arakhin', 'ערכין', 'Arakhin', 34),
      m('temurah', 'תמורה', 'Temurah', 34),
      m('keritot', 'כריתות', 'Keritot', 28),
      m('meilah', 'מעילה', 'Meilah', 22),
      m('tamid', 'תמיד', 'Tamid', 33),
      m('middot', 'מידות', '', 0),
      m('kinnim', 'קינים', '', 0),
    ],
  },
  {
    id: 'taharot',
    label: 'סדר טהרות',
    masechtot: [
      m('kelim', 'כלים', '', 0),
      m('oholot', 'אהלות', '', 0),
      m('negaim', 'נגעים', '', 0),
      m('parah', 'פרה', '', 0),
      m('taharot', 'טהרות', '', 0),
      m('mikvaot', 'מקוואות', '', 0),
      m('niddah', 'נדה', 'Niddah', 73),
      m('makhshirin', 'מכשירין', '', 0),
      m('zavim', 'זבים', '', 0),
      m('tevul-yom', 'טבול יום', '', 0),
      m('yadayim', 'ידיים', '', 0),
      m('uktzin', 'עוקצין', '', 0),
    ],
  },
];

const ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
const HUNDREDS = ['', 'ק', 'ר', 'ש', 'ת'];

/** Hebrew numeral for a daf number (2 → ב', 15 → ט"ו) */
export const gematria = (n: number): string => {
  let rest = n;
  let out = '';
  const hundreds = Math.floor(rest / 100);
  if (hundreds > 0) {
    out += HUNDREDS[Math.min(hundreds, 4)];
    rest -= Math.min(hundreds, 4) * 100;
    while (rest >= 100) {
      out += 'ת';
      rest -= 100;
    }
  }
  let tens = Math.floor(rest / 10);
  const ones = rest % 10;
  if (tens === 1 && (ones === 5 || ones === 6)) {
    out += ones === 5 ? 'טו' : 'טז';
    tens = -1;
  } else {
    out += TENS[tens] + ONES[ones];
  }
  if (out.length === 1) return `${out}'`;
  return `${out.slice(0, -1)}"${out.slice(-1)}`;
};

export const dapimOf = (masechet: ShasMasechet) => {
  if (!masechet.lastDaf) return [] as { id: string; label: string }[];
  const list: { id: string; label: string }[] = [];
  for (let d = 2; d <= masechet.lastDaf; d++) {
    list.push({ id: String(d), label: `דף ${gematria(d)}` });
  }
  return list;
};

export const findMasechet = (sederId: string, masechetId: string) => {
  const seder = SHAS.find((s) => s.id === sederId) ?? SHAS[0];
  const masechet = seder.masechtot.find((x) => x.id === masechetId) ?? seder.masechtot[0];
  return { seder, masechet };
};
