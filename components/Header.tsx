import React from 'react';

interface HeaderProps {
  onNavigate: (page: 'feed' | 'teams') => void;
  currentPage: 'feed' | 'teams';
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentPage }) => {
  const getNavLinkClasses = (page: 'feed' | 'teams') => {
    const isActive = currentPage === page;
    return `font-medium transition-colors duration-200 ${
      isActive
        ? 'text-white'
        : 'text-gray-400 hover:text-white'
    }`;
  };

  return (
    <header className="bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-700">
      <div className="container mx-auto px-4 md:px-6 py-4 flex items-center gap-8">
        <button onClick={() => onNavigate('feed')} className="text-left">
            <h1 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
            Daily Sports Briefing
            </h1>
        </button>
        <nav>
          <ul className="flex items-center gap-6">
            <li>
                <button onClick={() => onNavigate('teams')} className={getNavLinkClasses('teams')}>
                    My Teams
                </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};