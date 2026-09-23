import React from 'react';
import { motion } from 'motion/react';

export interface MobileNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export interface MobileBottomNavProps {
  items: MobileNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  items,
  activeId,
  onSelect,
  className = ''
}) => {
  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-gray-100 px-4 py-2 sm:hidden pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-[0_-8px_30px_rgba(0,0,0,0.05)] rounded-t-[32px] ${className}`}
    >
      <div className="flex items-center justify-between">
        {items.map((item) => {
          // Allow subroutes to highlight the main parent nav item
          const isActive = activeId.startsWith(item.id) && (item.id !== '/app' || activeId === '/app' || activeId === '/app/');
          
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all duration-300 min-h-[50px] min-w-[64px] relative cursor-pointer ${
                isActive
                  ? 'text-saremi-primary font-bold'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="relative z-10">
                {item.icon}
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.5 rounded-full bg-saremi-secondary text-white font-bold text-[10px] shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 leading-none tracking-tight z-10">
                {item.label}
              </span>
              
              {/* Fun active indicator blob */}
              {isActive && (
                <motion.div 
                  layoutId="activeNavBlob"
                  className="absolute inset-0 bg-saremi-soft-purple rounded-2xl z-0" 
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
