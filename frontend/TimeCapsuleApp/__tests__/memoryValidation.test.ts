import { validateMemory, hasErrors } from '../src/utils/memoryValidation';

describe('validateMemory', () => {
  test('returns no errors when text and photo are given', () => {
    const errors = validateMemory('Beach day', 'file:///photo.jpg');
    expect(errors).toEqual({});
    expect(hasErrors(errors)).toBe(false);
  });

  test('requires text', () => {
    const errors = validateMemory('', 'file:///photo.jpg');
    expect(errors.text).toBeDefined();
    expect(errors.photo).toBeUndefined();
  });

  test('treats spaces-only text as empty', () => {
    expect(validateMemory('   ', 'file:///photo.jpg').text).toBeDefined();
  });

  test('requires a photo', () => {
    const errors = validateMemory('Beach day', null);
    expect(errors.photo).toBeDefined();
    expect(errors.text).toBeUndefined();
  });

  test('treats an undefined photo as missing', () => {
    expect(validateMemory('Beach day', undefined).photo).toBeDefined();
  });

  test('reports both errors when both are missing', () => {
    const errors = validateMemory('', null);
    expect(errors.text).toBeDefined();
    expect(errors.photo).toBeDefined();
    expect(hasErrors(errors)).toBe(true);
  });
});