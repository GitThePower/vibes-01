
import React from 'react';
import type { AudioBriefing } from '../types';
import { AudioPlayer } from './AudioPlayer';
import { InfoIcon, LoaderIcon } from './icons';

interface FeedProps {
  briefings: AudioBriefing[];
  isGenerating: boolean;
  generationStatus: string;
  error: string | null;
  hasLikedTeams: boolean;
}

const GenerationStatusCard: React.FC<{ status: string }> = ({ status }) => (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-blue-500/50">
      <div className="flex items-center gap-4">
        <LoaderIcon className="w-8 h-8 text-blue-400 animate-spin" />
        <div>
          <h3 className="text-lg font-semibold">Generating Your Briefing...</h3>
          <p className="text-gray-400 mt-1">{status}</p>
        </div>
      </div>
    </div>
);

const EmptyStateCard: React.FC<{ hasLikedTeams: boolean }> = ({ hasLikedTeams }) => (
    <div className="bg-gray-800 rounded-lg p-8 shadow-lg text-center border border-gray-700">
      <InfoIcon className="w-12 h-12 text-blue-500 mx-auto mb-4" />
      <h3 className="text-xl font-semibold">
        {hasLikedTeams ? "Your Feed is Empty" : "Welcome!"}
      </h3>
      <p className="text-gray-400 mt-2">
        {hasLikedTeams 
         ? "Your daily briefing will appear here after 7:45 AM each day."
         : "Select some teams to get started. Your first briefing will be generated after 7:45 AM."
        }
      </p>
    </div>
);

const ErrorCard: React.FC<{ message: string }> = ({ message }) => (
    <div className="bg-red-900/50 rounded-lg p-6 shadow-lg border border-red-500/50">
        <h3 className="text-lg font-semibold text-red-300">Generation Failed</h3>
        <p className="text-red-300/80 mt-1">{message}</p>
    </div>
);

const BriefingCard: React.FC<{ briefing: AudioBriefing }> = ({ briefing }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    return (
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 transition-all duration-300">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">{briefing.title}</h2>
            <p className="text-gray-400 mt-1 mb-4">
                {new Date(briefing.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <AudioPlayer audioBase64={briefing.audioBase64} />
            <div className="mt-6">
                <button onClick={() => setIsExpanded(!isExpanded)} className="text-sm text-blue-400 hover:text-blue-300">
                    {isExpanded ? 'Hide Details' : 'Show Details & Sources'}
                </button>
                {isExpanded && (
                    <div className="mt-4 border-t border-gray-700 pt-4">
                        <h4 className="font-semibold mb-2">Briefing Script</h4>
                        <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">{briefing.summary}</p>
                        <h4 className="font-semibold mt-6 mb-2">Sources</h4>
                        <ul className="list-disc list-inside space-y-1">
                            {briefing.sources.map((source, index) => (
                                <li key={index} className="text-sm">
                                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                        {source.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export const Feed: React.FC<FeedProps> = ({ briefings, isGenerating, generationStatus, error, hasLikedTeams }) => {
  return (
    <div className="space-y-6">
      {error && <ErrorCard message={error} />}
      {isGenerating && <GenerationStatusCard status={generationStatus} />}
      
      {briefings.length === 0 && !isGenerating && <EmptyStateCard hasLikedTeams={hasLikedTeams} />}
      
      {briefings.map(briefing => (
        <BriefingCard key={briefing.id} briefing={briefing} />
      ))}
    </div>
  );
};
