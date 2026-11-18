import { motion } from 'framer-motion';

/** Living SVG flame: flickering layers + glow. */
const AnimatedFlame = ({ size = 120 }: { size?: number }) => (
  <motion.svg width={size} height={size * 1.2} viewBox="0 0 100 120"
    initial={{ scale: 0 }} animate={{ scale: [0, 1.25, 1] }} transition={{ duration: 0.8, ease: 'easeOut' }}
    style={{ filter: 'drop-shadow(0 0 18px rgba(249,115,22,.7))', transformOrigin: '50% 100%' }}>
    <defs>
      <linearGradient id="fo" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#ea580c"/><stop offset="1" stopColor="#facc15"/></linearGradient>
      <linearGradient id="fi" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#fde047"/><stop offset="1" stopColor="#fff7ed"/></linearGradient>
    </defs>
    <motion.path fill="url(#fo)" style={{ transformOrigin: '50% 100%' }}
      d="M50 4C58 30 86 44 86 78a36 36 0 0 1-72 0c0-20 12-28 16-44 6 10 10 14 14 16C46 34 44 18 50 4Z"
      animate={{ scaleY: [1, 1.06, 0.97, 1.04, 1], skewX: [0, 2, -2, 1, 0] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} />
    <motion.path fill="url(#fi)" style={{ transformOrigin: '50% 100%' }}
      d="M50 52c6 14 20 20 20 36a20 20 0 0 1-40 0c0-10 6-14 8-22 4 6 8 6 10 8 0-8 0-14 2-22Z"
      animate={{ scaleY: [1, 0.9, 1.08, 0.95, 1], scaleX: [1, 1.05, 0.96, 1] }}
      transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }} />
  </motion.svg>
);
export default AnimatedFlame;
