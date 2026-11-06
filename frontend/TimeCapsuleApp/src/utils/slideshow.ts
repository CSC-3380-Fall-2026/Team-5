import { Capsule } from '../context/CapsuleContext';
import { VideoTemplate } from '../templates/videoTemplates';

export type Slide =
  | { kind: 'title'; title: string; subtitle: string }
  | { kind: 'photo'; uri: string; caption: string }
  | { kind: 'end'; title: string };

// Title card, one slide per memory that has a photo, then an end card.
export function buildSlides(capsule: Capsule): Slide[] {
  // Add Memory saves '' when there is no photo, so filter those out
  const photos = (capsule.memories ?? []).filter(memory => memory.photoUri);
  if (photos.length === 0) {
    return [];
  }

  return [
    { kind: 'title', title: capsule.name, subtitle: `Opened ${capsule.unlockDate}` },
    ...photos.map(memory => ({
      kind: 'photo' as const,
      uri: memory.photoUri,
      caption: memory.text,
    })),
    { kind: 'end', title: 'The End' },
  ];
}

export function totalDurationSeconds(slides: Slide[], template: VideoTemplate): number {
  return slides.length * template.secondsPerPhoto;
}