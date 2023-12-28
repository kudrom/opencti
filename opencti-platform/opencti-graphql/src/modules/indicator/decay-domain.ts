export interface DecayModel {
  id: string
  decay_lifetime: number
  decay_factor: number
  decay_pound: number
  decay_points: number[]
  decay_revoked_cutoff: number
}
/** This is the model used when no configured decay model matches for an Indicator.
 * It's also the default one if nothing is configured yet. */
export const FALLBACK_DECAY_MODEL: DecayModel = {
  id: 'FALLBACK_DECAY_MODEL',
  decay_lifetime: 365, // 1 year
  decay_factor: 3.0, // hardcoded
  decay_pound: 1, // can be changed in other model when feature is ready.
  decay_points: [80, 60, 40], // reactions points
  decay_revoked_cutoff: 20 // revoked when score is <= 20
};
/**
 * Calculate the indicator score at a time (in days).
 * @param initialScore initial indicator score, usually between 100 and 0.
 * @param daysFromStart elapsed time in days since the start point.
 * @param model decay configuration to use.
 */
export const computeScoreFromExpectedTime = (initialScore: number, daysFromStart: number, model: DecayModel) => {
  // Polynomial implementation (MISP approach)
  if (daysFromStart > model.decay_lifetime) return 0;
  if (daysFromStart <= 0) return initialScore;
  return initialScore * (1 - ((daysFromStart / model.decay_lifetime) ** (1 / (model.decay_factor * model.decay_pound))));
};

/**
 * Calculate the elapsed time (in days) from start data to get a score value.
 * @param initialScore initial indicator score, usually between 100 and 0.
 * @param score the score value requested to calculate time
 * @param model decay configuration to use.
 */
export const computeTimeFromExpectedScore = (initialScore: number, score: number, model: DecayModel) => {
  // Polynomial implementation (MISP approach)
  return (Math.E ** (Math.log(1 - (score / initialScore)) * (model.decay_factor * model.decay_pound))) * model.decay_lifetime;
};
