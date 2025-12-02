// src/components/LoadingAnimation.tsx
import React from 'react';
import { Sparkles, Zap, Target, TrendingUp } from 'lucide-react';

interface LoadingAnimationProps {
  message?: string;
  submessage?: string;
  type?: 'optimization' | 'analysis' | 'generation' | 'payment';
  adImageUrl?: string;
  adImageAlt?: string;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  message = "Processing...",
  submessage = "Please wait while we work our magic",
  type = 'optimization',
  adImageUrl = "https://res.cloudinary.com/dvue2zenh/image/upload/v1759911969/becodghsmp77ugtnq4li.png",
  adImageAlt = "Referral Program Promo"
}) => {
  const getIcon = () => {
    switch (type) {
      case 'optimization': return <Target className="w-10 h-10" />;
      case 'analysis': return <TrendingUp className="w-10 h-10" />;
      case 'generation': return <Sparkles className="w-10 h-10" />;
      case 'payment': return <Zap className="w-10 h-10" />;
      default: return <Sparkles className="w-10 h-10" />;
    }
  };

  const getGradient = () => {
    switch (type) {
      case 'optimization': return 'from-emerald-500 to-cyan-500';
      case 'analysis': return 'from-purple-500 to-pink-500';
      case 'generation': return 'from-green-500 to-emerald-500';
      case 'payment': return 'from-orange-500 to-red-500';
      default: return 'from-emerald-500 to-cyan-500';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070b14] p-4">
      <div className="card-surface p-8 text-center max-w-md w-full transform transition-all duration-500">
        
        {/* Animated Icon */}
        <div className={`bg-gradient-to-r ${getGradient()} w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white animate-pulse shadow-emerald-glow`}>
          {getIcon()}
        </div>

        {/* Animated Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 bg-gradient-to-r ${getGradient()} rounded-full animate-bounce`}
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>

        {/* Messages */}
        <h2 className="text-xl font-bold text-slate-100 mb-2">{message}</h2>
        <p className="text-slate-400 mb-6 text-sm">{submessage}</p>

        {/* Promo Banner with Link */}
        {adImageUrl && (
          <div className="mb-6">
            <a href="https://primoboostai.in/refer" target="_blank" rel="noopener noreferrer">
              <img
                src={adImageUrl}
                alt={adImageAlt}
                className="w-full rounded-xl shadow-lg object-cover hover:scale-[1.02] transition duration-300 ease-in-out border border-slate-700/50"
              />
            </a>
            <p className="text-xs text-slate-500 mt-2">Invite your friend & earn rewards 🎁</p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 mb-4 overflow-hidden">
          <div 
            className={`bg-gradient-to-r ${getGradient()} h-1.5 rounded-full`} 
            style={{ 
              width: '100%',
              animation: 'shimmer 2s ease-in-out infinite'
            }} 
          />
        </div>

        <p className="text-xs text-slate-500">
          This may take a few moments as we process complex data and apply advanced algorithms.
        </p>
      </div>
    </div>
  );
};
