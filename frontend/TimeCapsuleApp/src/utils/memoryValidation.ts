export type MemoryErrors = {
  text?: string;
  photo?: string;
};

export function validateMemory(
  text: string,
  photoUri?: string | null,
): MemoryErrors {
  const errors: MemoryErrors = {};

  if (!text || text.trim().length === 0) {
    errors.text = 'Please write a note for this memory.';
  }

  if (!photoUri) {
    errors.photo = 'Please choose a photo.';
  }

  return errors;
}

export function hasErrors(errors: MemoryErrors): boolean {
  return Object.keys(errors).length > 0;
}