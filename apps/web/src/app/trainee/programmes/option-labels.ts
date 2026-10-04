/**
 * Shared labels for programme filter options and badges. Option values stay in
 * English because they are matched against programme data; only the display
 * text is translated.
 */
export type Translate = (key: string, fallback?: string) => string;

const OPTION_KEYS: Readonly<Record<string, string>> = {
  All: "trainee.programmes.optAll",
  Online: "trainee.programmes.modeOnline",
  "On-Campus": "trainee.programmes.modeOnCampus",
  Hybrid: "trainee.programmes.modeHybrid",
  "Offline Residential": "trainee.programmes.modeOfflineResidential",
  Beginner: "trainee.programmes.levelBeginner",
  Intermediate: "trainee.programmes.levelIntermediate",
  Advanced: "trainee.programmes.levelAdvanced",
  Recommended: "trainee.programmes.sortRecommended",
  Newest: "trainee.programmes.sortNewest",
  "Start Date": "trainee.programmes.sortStartDate",
  "Seats Available": "trainee.programmes.sortSeats",
  Popular: "trainee.programmes.sortPopular",
  Alphabetical: "trainee.programmes.sortAlphabetical",
};

export function optionLabel(t: Translate, value: string): string {
  return Object.hasOwn(OPTION_KEYS, value) ? t(OPTION_KEYS[value]) : value;
}
