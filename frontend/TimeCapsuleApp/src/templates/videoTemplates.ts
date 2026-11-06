export type VideoTemplate = {
  id: string;
  name: string;
  description: string;
  secondsPerPhoto: number;
  transitionMs: number;
  backgroundColor: string;
  textColor: string;
  showCaptions: boolean;
};

export const VIDEO_TEMPLATES: VideoTemplate[] = [
  {
    id: 'wedding',
    name: 'Wedding',
    description: 'Slow and romantic',
    secondsPerPhoto: 5,
    transitionMs: 1200,
    backgroundColor: '#fdf6ee',
    textColor: '#5a4636',
    showCaptions: true,
  },
  {
    id: 'college',
    name: 'College Year',
    description: 'Quick and upbeat',
    secondsPerPhoto: 2,
    transitionMs: 300,
    backgroundColor: '#111111',
    textColor: '#ffffff',
    showCaptions: true,
  },
  {
    id: 'travel',
    name: 'Travel',
    description: 'Bright and adventurous',
    secondsPerPhoto: 3,
    transitionMs: 600,
    backgroundColor: '#e8f4f8',
    textColor: '#12466b',
    showCaptions: true,
  },
  {
    id: 'birthday',
    name: 'Birthday',
    description: 'Colorful and festive',
    secondsPerPhoto: 3,
    transitionMs: 400,
    backgroundColor: '#ffe0f0',
    textColor: '#7a1f5c',
    showCaptions: true,
  },
  {
    id: 'bestfriends',
    name: 'Best Friends',
    description: 'Fun and playful',
    secondsPerPhoto: 2.5,
    transitionMs: 500,
    backgroundColor: '#2b1b3d',
    textColor: '#ffd9f0',
    showCaptions: true,
  },
];