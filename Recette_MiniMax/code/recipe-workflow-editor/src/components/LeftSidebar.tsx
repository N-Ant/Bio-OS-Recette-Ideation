import { useState } from 'react';
import { useVersioningStore } from '../versioning/store';

const menuItems = [
  { id: 'home', icon: 'home' },
  { id: 'grid', icon: 'grid' },
  { id: 'livraison', icon: 'livraison' },
  { id: 'chart', icon: 'chart' },
  { id: 'flask', icon: 'flask' },
  { id: 'history', icon: 'history' },
  { id: 'cursor', icon: 'cursor' },
  { id: 'settings', icon: 'settings' },
];

interface LeftSidebarProps {
  onActiveChange?: (activeId: string) => void;
}

export default function LeftSidebar({ onActiveChange }: LeftSidebarProps) {
  const [active, setActive] = useState('livraison');

  const handleClick = (id: string) => {
    if (id === 'history') {
      useVersioningStore.getState().setHistoryPanelOpen(true);
      return;
    }
    setActive(id);
    onActiveChange?.(id);
  };

  const renderIcon = (id: string, isActive: boolean) => {
    const color = isActive ? '#3B82F6' : '#9CA3AF';
    
    switch (id) {
      case 'home':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9,22 9,12 15,12 15,22"/>
          </svg>
        );
      case 'grid':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
        );
      case 'livraison':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill={isActive ? '#3B82F6' : 'none'} stroke={color} strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M9 3v18"/>
            <path d="M14 8l4 4-4 4"/>
          </svg>
        );
      case 'chart':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M3 3v18h18"/>
            <path d="M7 16l4-8 4 5 5-9"/>
          </svg>
        );
      case 'flask':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M9 3h6"/>
            <path d="M10 3v7.5L6 18.5a2 2 0 0 0 1.7 3h8.6a2 2 0 0 0 1.7-3L14 10.5V3"/>
          </svg>
        );
      case 'history':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
        );
      case 'cursor':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        );
      case 'settings':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 z-20">
      <div className="bg-white rounded-full shadow-lg py-3 lg:py-4 px-1.5 lg:px-2 flex flex-col items-center gap-2 lg:gap-3">
        {menuItems.map((item) => (
          <div key={item.id} className="relative">
            {active === item.id && (
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full" />
            )}
            <button
              onClick={() => handleClick(item.id)}
              className={`w-9 h-9 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center transition-colors ${
                active === item.id ? 'bg-blue-50' : 'hover:bg-gray-100'
              }`}
            >
              {renderIcon(item.id, active === item.id)}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
