// src/components/ui/ChristmasTheme.tsx
// Global Christmas theme components for the entire project
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Snowflake component
export const Snowflake: React.FC<{ delay: number; duration: number; size?: number }> = ({ 
  delay, 
  duration, 
  size = 1 
}) => {
  const startX = Math.random() * 100;
  const drift = (Math.random() - 0.5) * 50;
  
  return (
    <motion.div
      className="fixed pointer-events-none z-50"
      style={{
        left: `${startX}%`,
        top: -20,
        width: size * 8,
        height: size * 8,
      } as React.CSSProperties}
      initial={{ y: -20, x: 0, opacity: 0, rotate: 0 }}
      animate={{
        y: ['0vh', '105vh'],
        x: [0, drift, drift * 0.5, drift],
        opacity: [0, 1, 1, 0],
        rotate: [0, 360],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: 'linear',
      }}
    >
      <svg viewBox="0 0 24 24" fill="white" className="w-full h-full opacity-80">
        <path d="M12 0L13.5 4.5L18 3L15 7.5L19.5 9L15 10.5L18 15L13.5 13.5L12 18L10.5 13.5L6 15L9 10.5L4.5 9L9 7.5L6 3L10.5 4.5L12 0Z" />
      </svg>
    </motion.div>
  );
};

// Snow effect wrapper
export const SnowEffect: React.FC<{ intensity?: 'light' | 'medium' | 'heavy' }> = ({ 
  intensity = 'medium' 
}) => {
  const counts = { light: 15, medium: 30, heavy: 50 };
  const count = counts[intensity];

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(count)].map((_, i) => (
        <Snowflake
          key={i}
          delay={Math.random() * 10}
          duration={8 + Math.random() * 8}
          size={0.5 + Math.random() * 1}
        />
      ))}
    </div>
  );
};

// Christmas lights component
export const ChristmasLights: React.FC<{ position?: 'top' | 'bottom' }> = ({ position = 'top' }) => {
  const colors = ['#ff0000', '#00ff00', '#ffff00', '#ff00ff', '#00ffff', '#ff6600'];
  const lightCount = 20;

  return (
    <div className={`fixed left-0 right-0 z-40 flex justify-around px-4 ${
      position === 'top' ? 'top-16' : 'bottom-0'
    }`}>
      {[...Array(lightCount)].map((_, i) => (
        <motion.div
          key={i}
          className="relative"
          style={{ marginTop: Math.sin(i * 0.5) * 10 } as React.CSSProperties}
        >
          {/* Wire */}
          <div className="absolute -top-2 left-1/2 w-px h-3 bg-green-800" />
          {/* Bulb */}
          <motion.div
            className="w-3 h-4 rounded-full"
            style={{
              backgroundColor: colors[i % colors.length],
              boxShadow: `0 0 10px ${colors[i % colors.length]}, 0 0 20px ${colors[i % colors.length]}`,
            } as React.CSSProperties}
            animate={{
              opacity: [0.6, 1, 0.6],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{
              duration: 1 + Math.random(),
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
};

// Santa sleigh animation
export const SantaSleigh: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show Santa every 30 seconds
    const interval = setInterval(() => {
      setShow(true);
      setTimeout(() => setShow(false), 8000);
    }, 45000);

    // Show once on mount after 5 seconds
    const timeout = setTimeout(() => {
      setShow(true);
      setTimeout(() => setShow(false), 8000);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed z-50 pointer-events-none"
          initial={{ x: '-100%', y: '10vh' }}
          animate={{ x: '110vw', y: ['10vh', '15vh', '8vh', '12vh'] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 8, ease: 'linear' }}
        >
          <div className="text-4xl sm:text-5xl">🎅🛷🦌🦌🦌</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Christmas tree decoration
export const ChristmasTree: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizes = { sm: 'text-3xl', md: 'text-5xl', lg: 'text-7xl' };
  
  return (
    <motion.div
      className={`${sizes[size]} select-none`}
      animate={{ 
        scale: [1, 1.05, 1],
      }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      🎄
    </motion.div>
  );
};

// Festive gradient orb (red/green themed)
export const FestiveOrb: React.FC<{ className?: string; color?: 'red' | 'green' | 'gold' }> = ({ 
  className, 
  color = 'red' 
}) => {
  const colors = {
    red: 'bg-red-500/20',
    green: 'bg-green-500/20',
    gold: 'bg-yellow-500/20',
  };

  return (
    <motion.div
      className={`absolute rounded-full blur-3xl pointer-events-none ${colors[color]} ${className}`}
      animate={{
        scale: [1, 1.3, 1],
        opacity: [0.2, 0.4, 0.2],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
};

// Gift box animation
export const GiftBox: React.FC<{ className?: string }> = ({ className }) => (
  <motion.div
    className={`text-3xl select-none ${className}`}
    animate={{
      y: [0, -5, 0],
      rotate: [-5, 5, -5],
    }}
    transition={{ duration: 2, repeat: Infinity }}
  >
    🎁
  </motion.div>
);

// Candy cane decoration
export const CandyCane: React.FC<{ className?: string; rotate?: number }> = ({ 
  className, 
  rotate = 0 
}) => (
  <motion.div
    className={`text-2xl select-none ${className}`}
    style={{ transform: `rotate(${rotate}deg)` } as React.CSSProperties}
    animate={{ scale: [1, 1.1, 1] }}
    transition={{ duration: 3, repeat: Infinity }}
  >
    🍬
  </motion.div>
);

// Holly decoration
export const Holly: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`text-xl select-none ${className}`}>🎄</div>
);

// Christmas background wrapper
export const ChristmasBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative min-h-screen bg-gradient-to-b from-[#1a0a0f] via-[#0f1a0f] to-[#070b14] text-slate-100">
    {/* Festive gradient overlays */}
    <div className="fixed inset-0 pointer-events-none">
      <FestiveOrb className="w-[500px] h-[500px] -top-40 -left-40" color="red" />
      <FestiveOrb className="w-[400px] h-[400px] top-1/3 -right-40" color="green" />
      <FestiveOrb className="w-[300px] h-[300px] bottom-20 left-1/4" color="gold" />
    </div>
    
    {/* Subtle pattern overlay */}
    <div 
      className="fixed inset-0 pointer-events-none opacity-[0.02]"
      style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,0,0,0.1) 0%, transparent 50%),
                         radial-gradient(circle at 75% 75%, rgba(0,255,0,0.1) 0%, transparent 50%)`,
      }}
    />
    
    {children}
  </div>
);

// Dark theme page wrapper (matches HomePage style)
export const DarkPageWrapper: React.FC<{ 
  children: React.ReactNode;
  showSnow?: boolean;
  showSanta?: boolean;
  className?: string;
}> = ({ children, showSnow = true, showSanta = true, className = '' }) => {
  const [isChristmas] = useState(() => {
    const month = new Date().getMonth();
    return month === 11 || month === 0; // December or January
  });

  return (
    <div className={`relative min-h-screen text-slate-100 overflow-x-hidden ${
      isChristmas
        ? 'bg-gradient-to-b from-[#1a0a0f] via-[#0f1a0f] to-[#070b14]'
        : 'bg-gradient-to-b from-[#0a1e1e] via-[#0d1a1a] to-[#070b14]'
    } ${className}`}>
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {isChristmas ? (
          <>
            <FestiveOrb className="w-[600px] h-[600px] -top-40 -left-40" color="red" />
            <FestiveOrb className="w-[500px] h-[500px] top-1/3 -right-40" color="green" />
            <FestiveOrb className="w-[400px] h-[400px] bottom-20 left-1/4" color="gold" />
          </>
        ) : (
          <>
            <motion.div
              className="absolute w-[600px] h-[600px] -top-40 -left-40 bg-emerald-500/20 rounded-full blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
              className="absolute w-[500px] h-[500px] top-1/3 -right-40 bg-cyan-500/15 rounded-full blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 8, repeat: Infinity, delay: 2 }}
            />
          </>
        )}
      </div>

      {/* Grid pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Christmas effects */}
      {isChristmas && showSnow && <SnowEffect intensity="light" />}
      {isChristmas && showSanta && <SantaSleigh />}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default DarkPageWrapper;
