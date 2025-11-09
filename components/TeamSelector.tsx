import React, { useState, useMemo } from 'react';
import type { Team } from '../types';
import { CheckCircleIcon, PlusCircleIcon, XMarkIcon } from './icons';

interface TeamSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  allTeams: Team[];
  likedTeams: Team[];
  onToggleTeam: (team: Team) => void;
}

export const TeamSelector: React.FC<TeamSelectorProps> = ({
  isOpen,
  onClose,
  allTeams,
  likedTeams,
  onToggleTeam,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const likedTeamIds = useMemo(() => new Set(likedTeams.map(t => t.id)), [likedTeams]);

  const filteredTeams = useMemo(() => {
    return allTeams.filter(team =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.league.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allTeams, searchTerm]);
  
  const groupedTeams = useMemo(() => {
    // FIX: Refactored the reduce function to be more explicit.
    // The previous complex one-liner could cause issues with TypeScript's type inference,
    // leading to the 'teams' variable being incorrectly typed as 'unknown'.
    // This change ensures correct type inference and resolves the error.
    return filteredTeams.reduce((acc, team) => {
      const league = team.league;
      if (!acc[league]) {
        acc[league] = [];
      }
      acc[league].push(team);
      return acc;
    }, {} as Record<string, Team[]>);
  }, [filteredTeams]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 transition-opacity duration-300" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-800 rounded-t-lg">
          <h2 className="text-2xl font-bold">Select Your Teams</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="w-7 h-7" />
          </button>
        </div>
        <div className="p-6">
          <input
            type="text"
            placeholder="Search teams or leagues..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="overflow-y-auto p-6 pt-0 flex-grow">
          {Object.entries(groupedTeams).map(([league, teams]) => (
            <div key={league} className="mb-8">
              <h3 className="text-xl font-semibold text-blue-400 border-b border-gray-700 pb-2 mb-4">{league}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {teams.map(team => {
                  const isLiked = likedTeamIds.has(team.id);
                  return (
                    <button
                      key={team.id}
                      onClick={() => onToggleTeam(team)}
                      className={`p-3 rounded-lg flex flex-col items-center justify-center text-center transition-all duration-200 transform hover:scale-105 ${
                        isLiked ? 'bg-blue-600/20 border-2 border-blue-500' : 'bg-gray-700/50 border-2 border-transparent hover:border-gray-500'
                      }`}
                    >
                      <img src={team.logo} alt={team.name} className="w-16 h-16 mb-2 object-contain" />
                      <span className="font-medium text-sm">{team.name}</span>
                       <div className="mt-3">
                        {isLiked ? (
                          <div className="flex items-center gap-1 text-green-400 text-xs">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>Following</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-gray-400 text-xs">
                            <PlusCircleIcon className="w-4 h-4" />
                            <span>Follow</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
           {filteredTeams.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              <p>No teams found for "{searchTerm}".</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};