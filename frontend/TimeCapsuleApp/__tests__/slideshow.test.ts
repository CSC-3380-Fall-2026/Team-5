import { buildSlides } from '../src/utils/slideshow';
import { VIDEO_TEMPLATES } from '../src/templates/videoTemplates';

const capsule = (memories: any[]) => ({
  id: '1',
  name: 'Junior Year',
  unlockDate: '05/15/2026',
  friends: [],
  memories,
});

describe('buildSlides', () => {
  test('returns no slides when there are no memories', () => {
    expect(buildSlides(capsule([]))).toEqual([]);
  });

  test('skips memories without a photo', () => {
    const slides = buildSlides(capsule([{ id: 'm1', text: 'No photo', photoUri: '' }]));
    expect(slides).toEqual([]);
  });

  test('builds title, photo and end slides in order', () => {
    const slides = buildSlides(
      capsule([
        { id: 'm1', text: 'Beach', photoUri: 'file:///a.jpg' },
        { id: 'm2', text: 'Game day', photoUri: 'file:///b.jpg' },
      ]),
    );
    expect(slides.map(s => s.kind)).toEqual(['title', 'photo', 'photo', 'end']);
  });
});

describe('VIDEO_TEMPLATES', () => {
  test('every template has a unique id and a positive duration', () => {
    const ids = VIDEO_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    VIDEO_TEMPLATES.forEach(t => expect(t.secondsPerPhoto).toBeGreaterThan(0));
  });

  test('the college template is faster than the wedding template', () => {
    const wedding = VIDEO_TEMPLATES.find(t => t.id === 'wedding')!;
    const college = VIDEO_TEMPLATES.find(t => t.id === 'college')!;
    expect(college.secondsPerPhoto).toBeLessThan(wedding.secondsPerPhoto);
  });
});