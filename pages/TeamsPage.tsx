import React, { useState, useMemo } from 'react';
import type { Team } from '../types';
import { CheckCircleIcon, PlusCircleIcon } from '../components/icons';

interface TeamsPageProps {
  allTeams: Team[];
  likedTeams: Team[];
  onToggleTeam: (team: Team) => void;
}

export const TeamsPage: React.FC<TeamsPageProps> = ({
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
    return filteredTeams.reduce((acc, team) => {
      const league = team.league;
      if (!acc[league]) {
        acc[league] = [];
      }
      acc[league].push(team);
      return acc;
    }, {} as Record<string, Team[]>);
  }, [filteredTeams]);

  return (
    <div className="w-full">
        <div className="mb-6">
            <h2 className="text-3xl font-bold mb-1">Select Your Teams</h2>
            <p className="text-gray-400">Follow teams to get personalized daily audio briefings.</p>
        </div>
      
        <div className="mb-6 sticky top-[81px] bg-gray-900 py-4 z-5">
          <input
            type="text"
            placeholder="Search teams or leagues..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex-grow">
          {Object.keys(groupedTeams).length === 0 && searchTerm ? (
            <div className="text-center py-10 text-gray-500">
                <p>No teams found for "{searchTerm}".</p>
            </div>
          ) : Object.entries(groupedTeams).map(([league, teams]) => (
            <div key={league} className="mb-8">
              <h3 className="text-xl font-semibold text-blue-400 border-b border-gray-700 pb-2 mb-4">{league}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
        </div>
    </div>
  );
};