export interface Game {
  slug: string;
  title: string;
  description: string;
  category: string[];
  embed: { provider: string; iframeSrc: string; width: number; height: number };
  developer: string;
  released: string;
  genres: string[];
  intro: string;
  howToPlay: string[];
  tips: string[];
  faqs: { q: string; a: string }[];
  similar: string[];
  rating: { value: number; count: number } | null;
  playCount: number | null;
  items: { name: string; price: string }[];
  sources: Record<string, string>;
  thumbnail?: string;
}
