export function getErrorMessage(err: unknown): string {
  // In React Native, a failed network request throws a TypeError
  if (err instanceof TypeError) {
    return "Can't reach the server. Check your connection and try again.";
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return 'Something went wrong. Please try again.';
}