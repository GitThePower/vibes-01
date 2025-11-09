import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { TeamsPage } from './pages/TeamsPage';
import { Feed } from './components/Feed';
import { useLocalStorage } from './hooks/useLocalStorage';
import { generateDailyBriefing } from './services/geminiService';
import type { Team, AudioBriefing } from './types';
import { ALL_TEAMS } from './constants';

const App: React.FC = () => {
  const [likedTeams, setLikedTeams] = useLocalStorage<Team[]>('likedTeams', []);
  const [briefings, setBriefings] = useLocalStorage<AudioBriefing[]>('audioBriefings', []);
  const [currentPage, setCurrentPage] = useState<'feed' | 'teams'>('feed');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleToggleTeam = (team: Team) => {
    setLikedTeams(prev => {
      if (prev.some(t => t.id === team.id)) {
        return prev.filter(t => t.id !== team.id);
      } else {
        return [...prev, team];
      }
    });
  };

  const checkForDailyBriefing = useCallback(async () => {
    if (isGenerating || likedTeams.length === 0) return;

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const lastBriefingDate = localStorage.getItem('lastBriefingDate');

    if (lastBriefingDate === today) {
      console.log("Briefing already generated for today.");
      return;
    }
    
    const targetHour = 7;
    const targetMinute = 45;
    
    if (now.getHours() > targetHour || (now.getHours() === targetHour && now.getMinutes() >= targetMinute)) {
      console.log("It's past 7:45 AM, time to generate a briefing.");
      setIsGenerating(true);
      setError(null);
      try {
        const newBriefing = await generateDailyBriefing(likedTeams, setGenerationStatus);
        setBriefings(prev => [newBriefing, ...prev]);
        localStorage.setItem('lastBriefingDate', today);
      } catch (err) {
        console.error("Failed to generate daily briefing:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred during briefing generation.");
      } finally {
        setIsGenerating(false);
        setGenerationStatus('');
      }
    } else {
        console.log("It's not 7:45 AM yet.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [likedTeams, isGenerating, setBriefings]);


  useEffect(() => {
    if (currentPage === 'feed') {
        checkForDailyBriefing();
    }
  }, [checkForDailyBriefing, currentPage]);
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Header onNavigate={setCurrentPage} currentPage={currentPage} />
      <main className="container mx-auto p-4 md:p-6">
        {currentPage === 'feed' ? (
            <Feed 
                briefings={briefings}
                isGenerating={isGenerating}
                generationStatus={generationStatus}
                error={error}
                hasLikedTeams={likedTeams.length > 0}
            />
        ) : (
            <TeamsPage
                allTeams={ALL_TEAMS}
                likedTeams={likedTeams}
                onToggleTeam={handleToggleTeam}
            />
        )}
      </main>
    </div>
  );
};

export default App;