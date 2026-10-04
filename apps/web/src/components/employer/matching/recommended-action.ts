export interface RecommendedAction {
  text: string;
  /** True when the text was derived here from the score and gaps, not returned by the API. */
  ruleBased: boolean;
}

/**
 * Uses the API's recommendation when present. Otherwise a fixed rule over the
 * score and the number of missing required skills (no model involved).
 */
export function recommendedAction(score: number, missingCount: number, apiText?: string | null): RecommendedAction {
  if (apiText && apiText.trim()) return { text: apiText.trim(), ruleBased: false };
  if (score >= 80 && missingCount === 0) {
    return { text: "Shortlist and schedule an interview.", ruleBased: true };
  }
  if (score >= 65) {
    return { text: "Shortlist after reviewing the missing skills with the candidate.", ruleBased: true };
  }
  return { text: "Consider a training plan for the gaps before shortlisting.", ruleBased: true };
}
