import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, Star, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { removeNiqqud, useDictionary, type DictionaryWord } from '@/contexts/DictionaryContext';
import { isAudioEnabled } from '@/lib/audio';

const PREFIXES = ['ו', 'ד', 'ב', 'כ', 'ל', 'מ', 'ש', 'ה'];

/** Strip standard punctuation from the displayed Talmud text */
export const stripPunctuation = (s: string) =>
  s
    .replace(/[?,.:;!"״”“()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const speakWord = (word: string) => {
  if (!isAudioEnabled()) {
    toast.info('השמע כבוי בהגדרות');
    return;
  }
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.lang = 'he-IL';
    u.rate = 0.85;
    synth.speak(u);
  } catch {
    /* noop */
  }
};

export const useDictLookup = () => {
  const { dictionary } = useDictionary();
  const dictMap = useMemo(() => {
    const map = new Map<string, DictionaryWord>();
    dictionary.forEach((w) => {
      const key = removeNiqqud(w.aramaic).trim();
      if (key && !map.has(key)) map.set(key, w);
    });
    return map;
  }, [dictionary]);

  return useMemo(
    () =>
      (token: string): DictionaryWord | undefined => {
        const clean = removeNiqqud(token).replace(/[^\u05D0-\u05EA]/g, '');
        if (!clean) return undefined;
        const direct = dictMap.get(clean);
        if (direct) return direct;
        if (clean.length > 2 && PREFIXES.includes(clean[0])) return dictMap.get(clean.slice(1));
        return undefined;
      },
    [dictMap]
  );
};

const WordChip = ({
  token,
  entry,
  onSave,
  saved,
}: {
  token: string;
  entry?: DictionaryWord;
  onSave?: (entry: DictionaryWord) => void;
  saved: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  if (!entry) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <span role="button" tabIndex={0} className="cursor-default rounded-sm outline-none">
            {token}
          </span>
        </PopoverTrigger>
        <PopoverContent side="top" align="center" className="w-56 text-right text-xs text-muted-foreground">
          מילה זו תתווסף למילון האתר בהמשך 📝
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          aria-label={`${token} — ${entry.hebrew}`}
          className="rounded-md px-0.5 -mx-0.5 transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-ring bg-yellow-100 dark:bg-yellow-500/25 decoration-primary/40 underline decoration-dotted underline-offset-4"
        >
          {token}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="w-64 text-right"
      >
        <p className="font-display text-lg font-bold text-foreground">{entry.aramaic}</p>
        <p className="text-primary font-semibold text-sm mt-0.5">{entry.hebrew}</p>
        {entry.culturalContext && (
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{entry.culturalContext}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button
            onClick={() => speakWord(entry.aramaic)}
            className="flex items-center gap-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-full px-3 py-1.5 hover:bg-secondary/70 transition-colors"
            aria-label="השמעת המילה"
          >
            <Volume2 className="w-3.5 h-3.5" /> השמע 🔊
          </button>
          {onSave && (
            <button
              onClick={() => onSave(entry)}
              className={`flex items-center gap-1 text-xs font-medium rounded-full px-3 py-1.5 transition-colors ${
                saved ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground hover:bg-accent/70'
              }`}
              aria-label="שמור למילון אישי"
            >
              <Star className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
              {saved ? 'נשמר' : 'שמור'}
            </button>
          )}
          <button
            onClick={() => navigate(`/translator?q=${encodeURIComponent(entry.aramaic)}`)}
            className="flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary rounded-full px-3 py-1.5 hover:bg-primary/20 transition-colors w-full justify-center"
          >
            <BookOpen className="w-3.5 h-3.5" /> לצפייה במילון האתר 📖
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface GemaraTextProps {
  lines: string[];
  /** Study mode: highlights + tooltips. Test mode: plain text, no hints at all. */
  studyMode: boolean;
  onSave?: (entry: DictionaryWord) => void;
  savedWords?: string[];
}

const GemaraText = ({ lines, studyMode, onSave, savedWords = [] }: GemaraTextProps) => {
  const lookup = useDictLookup();

  return (
    <div className="text-justify">
      {lines.map((raw, li) => {
        const line = stripPunctuation(raw);
        if (!studyMode) {
          return (
            <p key={li} className="mb-4 leading-[2.2] text-lg md:text-xl font-display text-foreground select-none">
              {line}
            </p>
          );
        }
        return (
          <p key={li} className="mb-4 leading-[2.2] text-lg md:text-xl font-display text-foreground">
            {line.split(/(\s+)/).map((part, pi) => {
              if (/^\s+$/.test(part)) return <span key={pi}>{part}</span>;
              const entry = lookup(part);
              return (
                <WordChip
                  key={pi}
                  token={part}
                  entry={entry}
                  onSave={onSave}
                  saved={entry ? savedWords.includes(entry.aramaic) : false}
                />
              );
            })}
          </p>
        );
      })}
    </div>
  );
};

export default GemaraText;
