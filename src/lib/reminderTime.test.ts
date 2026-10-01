import { clampTime, DEFAULT_TIME, formatTime, MINUTE_STEP, stepHour, stepMinute } from './reminderTime';

describe('formatTime', () => {
  it('writes twenty-four hour time with both parts padded', () => {
    expect(formatTime({ hour: 20, minute: 0 })).toBe('20:00');
    expect(formatTime({ hour: 7, minute: 5 })).toBe('07:05');
    expect(formatTime({ hour: 0, minute: 0 })).toBe('00:00');
  });
});

describe('stepHour', () => {
  it('moves the hour and leaves the minute alone', () => {
    expect(stepHour({ hour: 20, minute: 30 }, 1)).toEqual({ hour: 21, minute: 30 });
    expect(stepHour({ hour: 20, minute: 30 }, -1)).toEqual({ hour: 19, minute: 30 });
  });

  it('wraps past midnight, both ways', () => {
    expect(stepHour({ hour: 23, minute: 0 }, 1)).toEqual({ hour: 0, minute: 0 });
    expect(stepHour({ hour: 0, minute: 0 }, -1)).toEqual({ hour: 23, minute: 0 });
  });
});

describe('stepMinute', () => {
  it('moves a quarter hour at a time', () => {
    expect(stepMinute({ hour: 20, minute: 0 }, 1)).toEqual({ hour: 20, minute: MINUTE_STEP });
    expect(stepMinute({ hour: 20, minute: 15 }, -1)).toEqual({ hour: 20, minute: 0 });
  });

  it('wraps within the hour without moving the hour', () => {
    expect(stepMinute({ hour: 20, minute: 45 }, 1)).toEqual({ hour: 20, minute: 0 });
    expect(stepMinute({ hour: 20, minute: 0 }, -1)).toEqual({ hour: 20, minute: 45 });
    expect(stepMinute({ hour: 23, minute: 45 }, 1)).toEqual({ hour: 23, minute: 0 });
  });
});

describe('clampTime', () => {
  it('keeps a good time as it is', () => {
    expect(clampTime({ hour: 6, minute: 30 })).toEqual({ hour: 6, minute: 30 });
  });

  it('pulls an out-of-range time back inside the day', () => {
    expect(clampTime({ hour: 31, minute: 99 })).toEqual({ hour: 23, minute: 59 });
    expect(clampTime({ hour: -2, minute: -5 })).toEqual({ hour: 0, minute: 0 });
  });

  it('rounds to whole numbers', () => {
    expect(clampTime({ hour: 7.6, minute: 14.4 })).toEqual({ hour: 8, minute: 14 });
  });

  it('falls back to the default for anything unreadable', () => {
    expect(clampTime({ hour: Number.NaN, minute: 0 })).toEqual(DEFAULT_TIME);
    expect(clampTime({ hour: 5, minute: Number.POSITIVE_INFINITY })).toEqual(DEFAULT_TIME);
  });
});
