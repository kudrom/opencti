export interface DecayModel {
  id: string
  decay_lifetime: number
  decay_factor: number
  decay_pounds: number
  decay_points: number[]
  decay_revoked_cutoff: number
}
/** This is the model used when no configured decay model matches for an Indicator.
 * It's also the default one if nothing is configured yet. */
export const FALLBACK_DECAY_MODEL: DecayModel = {
  id: 'FALLBACK_DECAY_MODEL',
  decay_lifetime: 30, // 30 days
  decay_factor: 3.0, // hardcoded
  decay_pounds: 1, // can be changed in other model when feature is ready.
  decay_points: [60, 40], // 2 reactions points
  decay_revoked_cutoff: 20 // revoked when score is <= 20
};
/**
 * Calculate the indicator score at a time.
 * @param initialScore initial indicator score, usually between 100 and 0.
 * @param delayFromStart elapsed time in millisecond since the start point.
 * @param model decay configuration to use.
 */
export const computeScoreFromExpectedTime = (initialScore: number, delayFromStart: number, model: DecayModel) => {
  // Polynomial implementation (MISP approach)
  if (delayFromStart > model.decay_lifetime) return 0;
  if (delayFromStart <= 0) return initialScore;
  return initialScore * (1 - ((delayFromStart / model.decay_lifetime) ** (1 / (model.decay_factor * model.decay_pounds))));
};

/**
 * Calculate the elapsed time from start data to get a score value.
 * @param initialScore initial indicator score, usually between 100 and 0.
 * @param score the score value requested to calculate time
 * @param model decay configuration to use.
 */
export const computeTimeFromExpectedScore = (initialScore: number, score: number, model: DecayModel) => {
  // Polynomial implementation (MISP approach)
  return (Math.E ** (Math.log(1 - (score / initialScore)) * (model.decay_factor * model.decay_pounds))) * model.decay_lifetime;
};
