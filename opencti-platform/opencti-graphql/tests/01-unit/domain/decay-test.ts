import { describe, it, expect } from 'vitest';
import { computeScoreFromExpectedTime, computeTimeFromExpectedScore, FALLBACK_DECAY_MODEL } from '../../../src/modules/indicator/decay-domain';

describe('Decay formula testing', () => {
  it('should compute score', () => {
    const baseScore = 100;
    const compute20Score = computeScoreFromExpectedTime(baseScore, 20, FALLBACK_DECAY_MODEL);
    expect(Math.round(compute20Score)).toBe(62);
    const compute28Score = computeScoreFromExpectedTime(baseScore, 28, FALLBACK_DECAY_MODEL);
    expect(Math.round(compute28Score)).toBe(58);
    const compute31Score = computeScoreFromExpectedTime(baseScore, 31, FALLBACK_DECAY_MODEL);
    expect(Math.round(compute31Score)).toBe(56);
    const compute366Score = computeScoreFromExpectedTime(baseScore, 366, FALLBACK_DECAY_MODEL);
    expect(Math.round(compute366Score)).toBe(0);
    const computeBadScore = computeScoreFromExpectedTime(baseScore, -5, FALLBACK_DECAY_MODEL);
    expect(Math.round(computeBadScore)).toBe(100);
  });

  it('should compute score and time', () => {
    const baseScore = 100;
    const compute20Score = computeScoreFromExpectedTime(baseScore, 20, FALLBACK_DECAY_MODEL);
    expect(Math.round(computeTimeFromExpectedScore(baseScore, compute20Score, FALLBACK_DECAY_MODEL))).toBe(20);
  });
});
