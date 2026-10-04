export function normaliseInstitutionStatus(status: string): string {
  return status.toLowerCase().replace(/[\s-]+/g, "_");
}
