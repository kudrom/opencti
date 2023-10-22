import { describe, expect, it } from 'vitest';
import { utcDate } from '../../../src/utils/format';

// Two subjects

// --- Base score computing of the indicator => initialAmount for decay
// 100 - if source of indicator confidence is A, 50 if not.
// associated numeric value to vocabularies to use a weight

// --- Decay speed depending on a decay model.
// Decay model must be associated to indicators depending on condition? main_observable_type?

const basicDecasyModel = {
  lifetime: 30,
  initialAmount: 100,
  decayFactor: 3.8,
  pound: 1
};

// region Polynomial implementation (MISP approach)
const computeScoreFromExpectedTime = (after, model) => {
  if (after > model.lifetime) return 0;
  if (after <= 0) return model.initialAmount;
  return model.initialAmount * (1 - ((after / model.lifetime) ** (1 / (model.decayFactor * model.pound))));
};

const computeTimeFromExpectedScore = (score, model) => {
  return (Math.E ** (Math.log(1 - (score / model.initialAmount)) * (model.decayFactor * model.pound))) * model.lifetime;
};
// endregion

const computeStepsFromDate = (model, startingFrom, scores) => {
  const computedSteps = [];
  for (let index = 0; index < scores.sort().reverse().length; index += 1) {
    const score = scores[index];
    const expectedTime = computeTimeFromExpectedScore(score, model);
    const nextStep = startingFrom.clone().add(expectedTime * 24, 'hours'); // Add with hours for more precision
    computedSteps.push({ score, at: nextStep.toISOString() });
  }
  return computedSteps;
};

describe('decay testing', () => {
  it('should base trim applied', () => {
    // const time = 30; // days
    const for20days = computeScoreFromExpectedTime(20, basicDecasyModel);
    console.log(`Score after 20 days = ${for20days}`);
    expect(Math.round(for20days)).toBe(10);
    console.log(`Score after 28 days = ${computeScoreFromExpectedTime(28, basicDecasyModel)}`);
    console.log(`Score after 31 days = ${computeScoreFromExpectedTime(31, basicDecasyModel)}`);
    // Threshold for 40 score
    const for10score = computeTimeFromExpectedScore(10.120593706493441, basicDecasyModel);
    console.log(`Threshold for 10 = ${for10score} days`);
    expect(Math.round(for10score)).toBe(20);
    // Try compute
    const starting = utcDate('2023-10-18T21:42:54.178Z');
    const steps = computeStepsFromDate(basicDecasyModel, starting, [80, 60, 40, 0]);
    console.log(steps);
  });
});
