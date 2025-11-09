
export interface Team {
  id: string;
  name: string;
  logo: string; // URL or path to logo
  league: string;
}

export interface AudioBriefing {
  id: string;
  date: string; // ISO string for the date
  title: string;
  summary: string; // The synthesized text
  audioBase64: string;
  sources: { uri: string; title: string }[];
}
