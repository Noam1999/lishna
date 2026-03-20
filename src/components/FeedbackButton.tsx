import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FeedbackButton = () => {
  const [hovered, setHovered] = useState(false);

  const handleClick = () => {
    const subject = encodeURIComponent('משוב על אפליקציית לישנא (גרסת בטא)');
    const body = encodeURIComponent('שלום! יש לי משוב על אפליקציית לישנא (גרסת בטא): ');
    window.open(`mailto:playcom1999@gmail.com?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <motion.button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="fixed bottom-24 left-4 z-50 flex items-center gap-2 bg-primary text-primary-foreground rounded-full shadow-elegant hover:shadow-lg transition-shadow"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{ padding: hovered ? '12px 18px' : '12px' }}
      aria-label="דיווח על באג / משוב"
    >
      <MessageCircle className="w-5 h-5 shrink-0" />
      <AnimatePresence>
        {hovered && (
          <motion.span
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-sm font-medium whitespace-nowrap overflow-hidden"
          >
            דיווח על באג / משוב
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default FeedbackButton;
