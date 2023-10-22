import {describe, expect, it} from 'vitest';
import {utcDate} from '../../../src/utils/format';
import type {BasicStoreIndicator} from '../../../src/types/store';

// Two subjects

// --- Base score computing of the indicator => initialAmount for decay
// 100 - if source of indicator confidence is A, 50 if not.
// associated numeric value to vocabularies to use a weight

// --- Decay speed depending on a decay model.
// Decay model must be associated to indicators depending on condition? main_observable_type?

interface DecayModel {
  id: string
  decay_lifetime: number
  decay_factor: number
  decay_pound: number
  decay_points: number[]
  decay_cutoff: number
}

interface IndicatorDecayStep {
  decay_step_score: number
  decay_step_at: string
  decay_step_revoked: boolean
}

interface IndicatorDecay {
  decay_model_id: string
  decay_base_score: number
  decay_model_steps: IndicatorDecayStep[]
}

const basicDecayModel: DecayModel = {
  id: 'MY_MODEL',
  decay_lifetime: 30,
  decay_factor: 3.8,
  decay_pound: 1,
  decay_points: [80, 60, 40, 0],
  decay_cutoff: 40
};

// region Polynomial implementation (MISP approach)
const computeScoreFromExpectedTime = (initialAmount: number, after: number, model: DecayModel) => {
  if (after > model.decay_lifetime) return 0;
  if (after <= 0) return initialAmount;
  return initialAmount * (1 - ((after / model.decay_lifetime) ** (1 / (model.decay_factor * model.decay_pound))));
};

const computeTimeFromExpectedScore = (initialAmount: number, score: number, model: DecayModel) => {
  return (Math.E ** (Math.log(1 - (score / initialAmount)) * (model.decay_factor * model.decay_pound))) * model.decay_lifetime;
};
// endregion

const computeIndicatorDecay = (indicator: BasicStoreIndicator, model: DecayModel): IndicatorDecay => {
  const computedSteps: IndicatorDecayStep[] = [];
  const { decay_points, decay_cutoff } = model;
  for (let index = 0; index < decay_points.sort().reverse().length; index += 1) {
    const point = decay_points[index];
    const expectedTime = computeTimeFromExpectedScore(indicator.x_opencti_score, point, model);
    const nextStep = utcDate(indicator.valid_from).clone().add(expectedTime * 24, 'hours'); // Add with hours for more precision
    computedSteps.push({ decay_step_score: point, decay_step_at: nextStep.toISOString(), decay_step_revoked: decay_cutoff >= point });
  }
  return {
    decay_model_id: model.id,
    decay_base_score: indicator.x_opencti_score,
    decay_model_steps: computedSteps
  };
};

describe('decay testing', () => {
  it('should compute score', () => {
    const baseScore = 100;
    // const time = 30; // days
    const compute20Score = computeScoreFromExpectedTime(baseScore, 20, basicDecayModel);
    expect(Math.round(compute20Score)).toBe(10);
    const compute28Score = computeScoreFromExpectedTime(baseScore, 28, basicDecayModel);
    expect(Math.round(compute28Score)).toBe(2);
    const compute31Score = computeScoreFromExpectedTime(baseScore, 31, basicDecayModel);
    expect(Math.round(compute31Score)).toBe(0);
  });

  it('should compute threshold', () => {
    // Threshold for 40 score
    const baseScore = 100;
    const compute20Score = computeScoreFromExpectedTime(baseScore, 20, basicDecayModel);
    expect(Math.round(computeTimeFromExpectedScore(baseScore, compute20Score, basicDecayModel))).toBe(20);
  });

  it('should compute creation indicator decay', () => {
    // Try compute
    const indicator = {
      x_opencti_score: 100,
      valid_from: new Date('2023-10-18T21:42:54.178Z'),
    } as BasicStoreIndicator;
    const indicatorDecay = computeIndicatorDecay(indicator, basicDecayModel);
    expect(indicatorDecay.decay_base_score).toBe(100);
    expect(indicatorDecay.decay_model_steps.length).toBe(4);
    expect(indicatorDecay.decay_model_steps[0].decay_step_at).toBe('2023-10-18T23:18:16.192Z');
    expect(indicatorDecay.decay_model_steps[0].decay_step_score).toBe(80);
    expect(indicatorDecay.decay_model_steps[1].decay_step_at).toBe('2023-10-19T19:51:15.030Z');
    expect(indicatorDecay.decay_model_steps[1].decay_step_score).toBe(60);
    expect(indicatorDecay.decay_model_steps[2].decay_step_at).toBe('2023-10-23T05:03:51.408Z');
    expect(indicatorDecay.decay_model_steps[2].decay_step_score).toBe(40);
    expect(indicatorDecay.decay_model_steps[3].decay_step_at).toBe('2023-11-17T21:42:54.178Z');
    expect(indicatorDecay.decay_model_steps[3].decay_step_score).toBe(0);
    expect(indicatorDecay.decay_model_steps[3].decay_step_revoked).toBe(true);
  });
});
