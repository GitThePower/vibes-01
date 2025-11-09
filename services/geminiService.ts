import { GoogleGenAI, Modality } from "@google/genai";
import type { Team, AudioBriefing } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getNewsForTeam = async (teamName: string): Promise<{ summary: string; sources: { uri: string; title: string }[] }> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a concise summary of the most important news, game results, and updates for the ${teamName} from the last 24 hours. Focus on key events and outcomes.`,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const summary = response.text;
        const rawSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = rawSources.map(s => ({
            uri: s.web?.uri || '#',
            title: s.web?.title || 'Unknown Source'
        })).filter(s => s.uri !== '#');

        return { summary, sources };
    } catch (error) {
        console.error(`Error fetching news for ${teamName}:`, error);
        return { summary: `Could not retrieve news for ${teamName}.`, sources: [] };
    }
};

const synthesizeNews = async (newsItems: string[]): Promise<string> => {
    const prompt = `You are a sports news anchor. Synthesize the following sports news updates into a single, cohesive, and engaging daily briefing script. Start with a friendly greeting like "Good morning! Here is your daily sports briefing." and then present the news clearly. \n\nUPDATES:\n${newsItems.join('\n---\n')}`;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });
    return response.text;
};

const refineBriefing = async (script: string): Promise<string> => {
    const prompt = `
        Analyze the following sports news briefing. Your task is to refine it for a casual sports fan.
        A casual fan is primarily interested in:
        - Final game scores and significant outcomes.
        - Major player news (significant injuries, record-breaking performances, trades).
        - Major team news (e.g., coaching changes, playoff implications).
        - They are NOT interested in minor details, deep statistical analysis, routine player quotes, or non-critical game previews.

        Filter the content, retaining only the key updates that are highly relevant (with at least 80% confidence) to a casual fan.
        Rewrite the briefing to be more concise and focused on these key highlights. The tone should remain engaging and informative.
        Do not add any preamble like "Here is the refined briefing". Just provide the refined script directly.

        Original Briefing:
        ---
        ${script}
        ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error refining briefing:", error);
        // If refinement fails, return the original script to not break the flow.
        return script;
    }
};


const generateAudio = async (script: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: script }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
        throw new Error("Failed to generate audio data.");
    }
    return audioData;
};

export const generateDailyBriefing = async (teams: Team[], setStatus: (status: string) => void): Promise<AudioBriefing> => {
    const newsItems: string[] = [];
    let allSources: { uri: string; title: string }[] = [];

    for (let i = 0; i < teams.length; i++) {
        const team = teams[i];
        setStatus(`Fetching news for ${team.name} (${i + 1}/${teams.length})...`);
        const { summary, sources } = await getNewsForTeam(team.name);
        newsItems.push(`News for ${team.name}:\n${summary}`);
        allSources = [...allSources, ...sources];
    }
    
    if (newsItems.length === 0) {
        throw new Error("No news could be fetched for any of the selected teams.");
    }

    setStatus("Synthesizing news into a single briefing...");
    const initialScript = await synthesizeNews(newsItems);
    
    setStatus("Refining briefing for key updates...");
    const refinedScript = await refineBriefing(initialScript);

    setStatus("Generating audio overview...");
    const audioBase64 = await generateAudio(refinedScript);

    setStatus("Finalizing your briefing...");
    const today = new Date();
    const uniqueSources = Array.from(new Map(allSources.map(item => [item.uri, item])).values());


    return {
        id: today.toISOString(),
        date: today.toISOString(),
        title: `Your Daily Sports Briefing - ${today.toLocaleDateString()}`,
        summary: refinedScript,
        audioBase64: audioBase64,
        sources: uniqueSources,
    };
};