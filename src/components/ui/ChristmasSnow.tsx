import React from 'react';
import { motion } from 'framer-motion';

interface ChristmasSnowProps {
  count?: number;
}

export const ChristmasSnow: React.FC<ChristmasSnowProps> = ({ count = 30 }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/60 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-10px`,
          }}
          animate={{
            y: ['0vh', '110vh'],
            opacity: [0, 0.8, 0],
            x: [0, Math.random() * 40 - 20],
          }}
          transition={{
            duration: 8 + Math.random() * 6,
            repeat: Infinity,
            delay: Math.random() * 8,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
};
