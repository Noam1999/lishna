import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DictionaryWord } from '@/contexts/DictionaryContext';

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (word: DictionaryWord) => void;
  suggestions: DictionaryWord[];
  placeholder?: string;
  direction: 'hebrew-to-aramaic' | 'aramaic-to-hebrew';
}

const SearchAutocomplete = ({
  value,
  onChange,
  onSelect,
  suggestions,
  placeholder,
  direction,
}: SearchAutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Show dropdown when there are suggestions and input has value
  useEffect(() => {
    setIsOpen(suggestions.length > 0 && value.trim().length > 0);
    setHighlightedIndex(-1);
  }, [suggestions, value]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSelect = (word: DictionaryWord) => {
    const searchValue = direction === 'hebrew-to-aramaic' ? word.hebrew : word.aramaic;
    onChange(searchValue);
    onSelect(word);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const getDisplayText = (word: DictionaryWord) => {
    if (direction === 'hebrew-to-aramaic') {
      return { primary: word.hebrew, secondary: word.aramaic };
    }
    return { primary: word.aramaic, secondary: word.hebrew };
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && value.trim() && setIsOpen(true)}
          onBlur={() => {
            // Delay to allow click on suggestion
            setTimeout(() => setIsOpen(false), 150);
          }}
          placeholder={placeholder}
          className="w-full bg-card border border-border rounded-xl py-4 px-5 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-right"
          dir="rtl"
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-elegant overflow-hidden animate-fade-in"
          style={{ maxHeight: '280px', overflowY: 'auto' }}
        >
          {suggestions.map((word, index) => {
            const { primary, secondary } = getDisplayText(word);
            const isHighlighted = index === highlightedIndex;

            return (
              <li
                key={word.id}
                role="option"
                aria-selected={isHighlighted}
                onClick={() => handleSelect(word)}
                className={cn(
                  'flex items-center justify-between px-4 py-3 cursor-pointer transition-colors border-b border-border/50 last:border-b-0',
                  isHighlighted
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-accent/50'
                )}
              >
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {word.type}
                </span>
                <div className="flex items-center gap-3 text-right">
                  <span className="text-sm text-muted-foreground">
                    → {secondary}
                  </span>
                  <span className="font-medium text-foreground">
                    {primary}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default SearchAutocomplete;
