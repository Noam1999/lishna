import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode } from 'react';

const PageTransition = ({ children }: { children: ReactNode }) => {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
