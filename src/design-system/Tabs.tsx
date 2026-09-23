import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'pills' | 'underline';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'pills',
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        if (variant === 'underline') {
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`pb-3 px-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'border-[#121829] text-[#121829] font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-700 font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              isActive
                ? 'bg-[#121829] text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-[#F4F1EA] hover:text-gray-900 border border-gray-200/80'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
