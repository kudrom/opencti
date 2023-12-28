import moment from 'moment';
import type { Moment } from 'moment';

export interface DecayRule {
  id: string
  decay_lifetime: number // in days
  decay_pound: number // can be changed in other model when feature is ready.
  decay_points: number[] // reactions points
  decay_revoke_score: number // revoked when score is <= 20
  indicator_types: string[] // x_opencti_main_observable_type
  order: number // low priority = 0
  enabled: boolean
}
/** This is the model used when no configured decay model matches for an Indicator.
 * It's also the default one if nothing is configured yet. */
export const FALLBACK_DECAY_RULE: DecayRule = {
  id: 'FALLBACK_DECAY_RULE',
  decay_lifetime: 365, // 1 year
  decay_pound: 1.0,
  decay_points: [80, 60, 40, 20],
  decay_revoke_score: 0,
  indicator_types: [],
  order: 0,
  enabled: true,
};
export const IP_DECAY_RULE: DecayRule = {
  id: 'IP_DECAY_RULE',
  decay_lifetime: 60,
  decay_pound: 1.0,
  decay_points: [80, 60, 40, 20],
  decay_revoke_score: 0,
  indicator_types: ['IPv4-Addr', 'IPv6-Addr'],
  order: 1,
  enabled: true,
};
export const URL_DECAY_RULE: DecayRule = {
  id: 'URL_DECAY_RULE',
  decay_lifetime: 180,
  decay_pound: 1.0,
  decay_points: [80, 60, 40, 20],
  decay_revoke_score: 0,
  indicator_types: ['Url'],
  order: 1,
  enabled: true,
};
export const BUILT_IN_DECAY_RULES = [
  IP_DECAY_RULE, URL_DECAY_RULE, FALLBACK_DECAY_RULE,
];

const DECAY_FACTOR: number = 3.0;

/**
 * Calculate the indicator score at a time (in days).
 * @param initialScore initial indicator score, usually between 100 and 0.
 * @param daysFromStart elapsed time in days since the start point.
 * @param rule decay configuration to use.
 */
export const computeScoreFromExpectedTime = (initialScore: number, daysFromStart: number, rule: DecayRule) => {
  // Polynomial implementation (MISP approach)
  if (daysFromStart > rule.decay_lifetime) return 0;
  if (daysFromStart <= 0) return initialScore;
  return initialScore * (1 - ((daysFromStart / rule.decay_lifetime) ** (1 / (DECAY_FACTOR * rule.decay_pound))));
};

/**
 * Calculate the elapsed time (in days) from start data to get a score value.
 * @param initialScore initial indicator score, usually between 100 and 0.
 * @param score the score value requested to calculate time
 * @param model decay configuration to use.
 */
export const computeTimeFromExpectedScore = (initialScore: number, score: number, model: DecayRule) => {
  // Polynomial implementation (MISP approach)
  return (Math.E ** (Math.log(1 - (score / initialScore)) * (DECAY_FACTOR * model.decay_pound))) * model.decay_lifetime;
};

export const computeNextScoreReactionDate = (initialScore: number, stableScore: number, model: DecayRule, startDate: Moment) => {
  const nextKeyPoint = model.decay_points.find((p) => p < stableScore) || model.decay_revoke_score;
  const daysDelay = computeTimeFromExpectedScore(initialScore, nextKeyPoint, model);
  return moment(startDate).add(daysDelay, 'days').toDate();
};

export const findDecayRuleForIndicator = (indicatorObservableType: string, enabledRules: DecayRule[]) => {
  if (!indicatorObservableType) {
    return FALLBACK_DECAY_RULE;
  }
  const orderedRules = [...enabledRules].sort((a, b) => b.order - a.order);
  const decayRule = orderedRules.find((rule) => rule.indicator_types.includes(indicatorObservableType) || rule.indicator_types.length === 0);
  return decayRule || FALLBACK_DECAY_RULE;
};
