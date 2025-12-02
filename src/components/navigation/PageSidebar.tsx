// src/components/navigation/PageSidebar.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Target,
  PlusCircle,
  MessageSquare,
  TrendingUp,
  MessageCircle,
  Gamepad2,
  BookOpen,
  Info,
  Phone,
  Briefcase,
  FileText,
  Sparkles,
  CreditCard,
} from 'lucide-react';

// Interfaces
interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  highlight?: boolean; // For special highlighting
}

interface SidebarSection {
  id: string;
  label: string;
  items: SidebarItem[];
}

interface PageSidebarProps {
  currentPath?: string;
}

// Navigation items configuration
const toolsSection: SidebarSection = {
  id: 'tools',
  label: 'Tools',
  items: [
    { id: 'optimizer', label: 'JD-Based Optimizer', icon: <Target className="w-5 h-5" />, path: '/optimizer' },
    { id: 'guided-builder', label: 'Guided Resume Builder', icon: <PlusCircle className="w-5 h-5" />, path: '/guided-builder' },
    { id: 'mock-interview', label: 'AI Mock Interview', icon: <MessageSquare className="w-5 h-5" />, path: '/mock-interview' },
    { id: 'score-checker', label: 'Resume Score Check', icon: <TrendingUp className="w-5 h-5" />, path: '/score-checker' },
    { id: 'linkedin-generator', label: 'Outreach Messages', icon: <MessageCircle className="w-5 h-5" />, path: '/linkedin-generator' },
    { id: 'gaming', label: 'Gaming Aptitude', icon: <Gamepad2 className="w-5 h-5" />, path: '/gaming' },
  ],
};

const pagesSection: SidebarSection = {
  id: 'pages',
  label: 'Explore',
  items: [
    { id: 'jobs', label: 'Explore Jobs', icon: <Briefcase className="w-5 h-5" />, path: '/jobs' },
    { id: 'pricing', label: 'Pricing', icon: <CreditCard className="w-5 h-5" />, path: '/pricing' },
    { id: 'blog', label: 'Blog', icon: <FileText className="w-5 h-5" />, path: '/blog' },
    { id: 'webinars', label: 'Webinars', icon: <Sparkles className="w-5 h-5" />, path: '/webinars' },
    { id: 'tutorials', label: 'Tutorials', icon: <BookOpen className="w-5 h-5" />, path: '/tutorials' },
    { id: 'about', label: 'About Us', icon: <Info className="w-5 h-5" />, path: '/about' },
    { id: 'contact', label: 'Contact Us', icon: <Phone className="w-5 h-5" />, path: '/contact' },
  ],
};



export const PageSidebar: React.FC<PageSidebarProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => location.pathname === path;

  const renderSidebarItem = (item: SidebarItem, _index: number) => {
    const active = isActive(item.path);
    const isHovered = hoveredItem === item.id;

    return (
      <div key={item.id} className="relative">
        <motion.button
          onClick={() => handleNavigation(item.path)}
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem(null)}
          className={`w-full flex items-center justify-center p-3 rounded-lg transition-all duration-200 ${
            active
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          whileTap={{ scale: 0.95 }}
        >
          <span className="flex-shrink-0">{item.icon}</span>
        </motion.button>

        {/* Tooltip on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, x: -8, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap z-[10000] bg-slate-800 text-slate-100 border border-slate-700 shadow-xl"
            >
              {item.label}
              {/* Arrow */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-800 border-l border-b border-slate-700 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <motion.aside
      initial={{ width: 64 }}
      animate={{ width: 64 }}
      className="fixed left-0 top-14 sm:top-16 bottom-0 z-[9999] hidden md:flex flex-col bg-[#0a1612]/95 backdrop-blur-sm border-r border-slate-800/50"
    >
      {/* Tools Section */}
      <div className="flex-1 overflow-y-auto px-2 pt-4">
        <div className="space-y-1">
          {toolsSection.items.map((item, index) => renderSidebarItem(item, index))}
        </div>

        {/* Divider */}
        <div className="my-4 mx-2 border-t border-slate-800" />

        {/* Pages Section */}
        <div className="space-y-1">
          {pagesSection.items.map((item, index) =>
            renderSidebarItem(item, index + toolsSection.items.length)
          )}
        </div>
      </div>
    </motion.aside>
  );
};
