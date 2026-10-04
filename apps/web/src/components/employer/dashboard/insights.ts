import type { EmployerDashboard } from "@/lib/employer/jobs-api";

/**
 * Templated recruitment insight sentences. Every sentence is built from a
 * concrete field of the dashboard payload and is only emitted when that field
 * supports it. No model call happens here, so the output is deterministic.
 */
export function buildRecruitmentInsights(dashboard: EmployerDashboard, activeJobs: number): string[] {
  const sentences: string[] = [];
  const applications = dashboard.kpis.applications.value;

  if (applications > 0) {
    sentences.push(
      `${applications} ${plural(applications, "application", "applications")} received across ${activeJobs} active ${plural(activeJobs, "job", "jobs")}.`,
    );
  } else {
    sentences.push("No applications have come in yet. Publishing a job with clear required skills is the fastest way to start.");
  }

  const weakest = weakestConversion(dashboard.funnel);
  if (weakest) {
    sentences.push(
      `Only ${weakest.conversion}% of candidates moved from ${weakest.from} to ${weakest.to}, the weakest step in the funnel. Review criteria at that stage.`,
    );
  }

  const [topSkill, secondSkill] = [...dashboard.skill_match].sort((a, b) => b.count - a.count);
  if (topSkill) {
    const follow = secondSkill ? ` ${secondSkill.skill} follows with ${secondSkill.count}.` : "";
    sentences.push(`${topSkill.skill} is the most requested skill among matched candidates (${topSkill.count}).${follow}`);
  }

  const strongest = dashboard.top_candidates[0];
  if (strongest) {
    sentences.push(`${strongest.name} is the strongest current match at ${strongest.match_score}%.`);
  }

  const topSource = [...dashboard.candidate_sources].sort((a, b) => b.percent - a.percent)[0];
  if (topSource && topSource.percent > 0) {
    sentences.push(`${topSource.label} is the largest candidate source at ${topSource.percent}% of applications.`);
  }

  const offered = dashboard.funnel.find((stage) => stage.key === "offered")?.count ?? 0;
  const hired = dashboard.kpis.hired.value;
  if (hired > 0 || offered > 0) {
    sentences.push(`${hired} ${plural(hired, "hire", "hires")} recorded so far, with ${offered} ${plural(offered, "offer", "offers")} currently in the pipeline.`);
  }

  const trend = timelineTrend(dashboard.hiring_timeline);
  if (trend) sentences.push(trend);

  return sentences;
}

function plural(n: number, singular: string, pluralForm: string): string {
  return n === 1 ? singular : pluralForm;
}

function weakestConversion(
  funnel: EmployerDashboard["funnel"],
): { from: string; to: string; conversion: number } | null {
  let weakest: { from: string; to: string; conversion: number } | null = null;
  for (let i = 1; i < funnel.length; i += 1) {
    const conversion = funnel[i].conversion;
    if (conversion === null || funnel[i - 1].count === 0) continue;
    if (weakest === null || conversion < weakest.conversion) {
      weakest = { from: funnel[i - 1].label, to: funnel[i].label, conversion };
    }
  }
  return weakest;
}

function timelineTrend(timeline: EmployerDashboard["hiring_timeline"]): string | null {
  if (timeline.length < 2) return null;
  const last = timeline[timeline.length - 1];
  const prev = timeline[timeline.length - 2];
  if (last.applications === prev.applications) {
    return `Applications held steady at ${last.applications} in ${last.month} compared with ${prev.month}.`;
  }
  const direction = last.applications > prev.applications ? "rose" : "fell";
  return `Applications ${direction} from ${prev.applications} in ${prev.month} to ${last.applications} in ${last.month}.`;
}
