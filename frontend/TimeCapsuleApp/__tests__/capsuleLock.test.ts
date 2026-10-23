import { isCapsuleLocked, daysUntilUnlock } from '../src/utils/capsuleLock';

describe('isCapsuleLocked', () => {
  const now = new Date(2027, 4, 15, 12, 0); // May 15, 2027, noon

  test('is locked when the open date is in the future', () => {
    expect(isCapsuleLocked('2027-06-01', now)).toBe(true);
  });

  test('is unlocked when the open date is in the past', () => {
    expect(isCapsuleLocked('2027-01-01', now)).toBe(false);
  });

  test('is unlocked on the open date itself', () => {
    expect(isCapsuleLocked('2027-05-15', now)).toBe(false);
  });
});

describe('daysUntilUnlock', () => {
  test('counts the days remaining', () => {
    const now = new Date(2027, 4, 15, 0, 0);
    expect(daysUntilUnlock('2027-05-20', now)).toBe(5);
  });

  test('never goes below zero', () => {
    expect(daysUntilUnlock('2020-01-01', new Date(2027, 0, 1))).toBe(0);
  });
});