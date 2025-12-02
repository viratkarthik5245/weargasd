import React from 'react';
import { Home, Info, BookOpen, Phone, Menu, Wallet, User, Briefcase, FileText, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface MobileNavBarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({ currentPage, onPageChange }) => {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.email === 'primoboostai@gmail.com');

  const navItems = [
    { id: '/', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: '/about', label: 'About', icon: <Info className="w-5 h-5" /> },
    { id: '/careers', label: 'Careers', icon: <Briefcase className="w-5 h-5" /> },
    { id: '/jobs', label: 'Jobs', icon: <Briefcase className="w-5 h-5" /> },
    { id: '/tutorials', label: 'Tutorials', icon: <BookOpen className="w-5 h-5" /> },
    { id: '/contact', label: 'Contact', icon: <Phone className="w-5 h-5" /> },
    ...(isAuthenticated ? [{ id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> }] : []),
    ...(isAuthenticated ? [{ id: 'wallet', label: 'Wallet', icon: <Wallet className="w-5 h-5" /> }] : []),
    ...(isAuthenticated ? [{ id: '/jobs/applications', label: 'Applications', icon: <FileText className="w-5 h-5" /> }] : []),
    ...(isAdmin ? [{ id: '/admin/email-testing', label: 'Email', icon: <Mail className="w-5 h-5" /> }] : []),
    { id: 'menu', label: 'Menu', icon: <Menu className="w-5 h-5" /> }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 shadow-lg lg:hidden safe-area">
      <div className="flex items-center justify-around pb-safe-bottom">
        {navItems.map((item) => (
          item.id === 'menu' || item.id === 'profile' || item.id === 'wallet' ? (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`flex flex-col items-center justify-center py-2 sm:py-3 px-2 min-w-touch min-h-touch transition-colors touch-spacing ${
                currentPage === item.id
                  ? 'text-emerald-400'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className={`p-1.5 rounded-full mb-1 transition-colors ${
                currentPage === item.id ? 'bg-emerald-500/20' : 'hover:bg-slate-800'
              }`}>
                {item.icon}
              </div>
              <span className="text-xs font-medium leading-tight">{item.label}</span>
            </button>
          ) : (
            <Link
              key={item.id}
              to={item.id}
              className={`flex flex-col items-center justify-center py-2 sm:py-3 px-2 min-w-touch min-h-touch transition-colors touch-spacing ${
                window.location.pathname === item.id
                  ? 'text-emerald-400'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className={`p-1.5 rounded-full mb-1 transition-colors ${
                window.location.pathname === item.id ? 'bg-emerald-500/20' : 'hover:bg-slate-800'
              }`}>
                {item.icon}
              </div>
              <span className="text-xs font-medium leading-tight">{item.label}</span>
            </Link>
          )
        ))}
      </div>
    </div>
  );
};
