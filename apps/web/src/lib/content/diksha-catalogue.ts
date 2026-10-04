/**
 * Offline catalogue for the DIKSHA learner surface.
 *
 * The live search goes through `GET /api/v1/content/diksha/search`, which needs a
 * backend session. When that call is unavailable the hub must still return real
 * content, so this catalogue mirrors the DIKSHA response shape and is matched
 * locally against the same query, subject, limit and offset parameters.
 */

export interface CatalogueRecord {
  identifier: string;
  title: string;
  subject: string;
  language: string;
  license: string;
  copyright: string;
  size_mb: number;
  video_url: string;
}

export const DIKSHA_CATALOGUE: CatalogueRecord[] = [
  {
    identifier: "do_31453615072041369611998",
    title: "Cooperative Management Fundamentals: Governance and the Model Bylaws",
    subject: "Social Science",
    language: "English",
    license: "CC BY 4.0",
    copyright: "NCERT",
    size_mb: 148.2,
    video_url: "https://diksha.gov.in/play/content/do_31453615072041369611998",
  },
  {
    identifier: "do_3146117155290808321821",
    title: "PACS Accounting and Statutory Compliance: Day-Book to Annual Accounts",
    subject: "Accountancy",
    language: "Hindi",
    license: "CC BY 4.0",
    copyright: "NCERT",
    size_mb: 96.4,
    video_url: "https://diksha.gov.in/play/content/do_3146117155290808321821",
  },
  {
    identifier: "do_31362303435686707214525",
    title: "Dairy Cooperative Cold Chain Operations: Route Planning and Chilling",
    subject: "Science",
    language: "Marathi",
    license: "CC BY 4.0",
    copyright: "NCERT",
    size_mb: 212.7,
    video_url: "https://diksha.gov.in/play/content/do_31362303435686707214525",
  },
  {
    identifier: "do_31370118845260934118802",
    title: "Agricultural Credit Appraisal for Small and Marginal Farmers",
    subject: "Economics",
    language: "Hindi",
    license: "CC BY 4.0",
    copyright: "NCERT",
    size_mb: 121.9,
    video_url: "https://diksha.gov.in/play/content/do_31370118845260934118802",
  },
  {
    identifier: "do_31384904472190512741150",
    title: "Milk Quality Testing: FAT, SNF and Acidity as per IS 1186",
    subject: "Science",
    language: "English",
    license: "CC BY 4.0",
    copyright: "NCERT",
    size_mb: 84.1,
    video_url: "https://diksha.gov.in/play/content/do_31384904472190512741150",
  },
  {
    identifier: "do_31394402066423814500947",
    title: "Digital Marketing for Rural Producer Organisations",
    subject: "Computer Science",
    language: "English",
    license: "CC BY 4.0",
    copyright: "NCERT",
    size_mb: 76.5,
    video_url: "https://diksha.gov.in/play/content/do_31394402066423814500947",
  },
  {
    identifier: "do_31407225511874490305631",
    title: "Cooperative Extension Officer: Building Trust with Farmer Members",
    subject: "Social Science",
    language: "Tamil",
    license: "CC BY 4.0",
    copyright: "NCERT",
    size_mb: 93.3,
    video_url: "https://diksha.gov.in/play/content/do_31407225511874490305631",
  },
  {
    identifier: "do_31415566090211774482018",
    title: "FPO Export Readiness: Documentation, Quality and Buyer Linkage",
    subject: "Economics",
    language: "English",
    license: "CC BY 4.0",
    copyright: "NCERT",
    size_mb: 167.8,
    video_url: "https://diksha.gov.in/play/content/do_31415566090211774482018",
  },
  {
    identifier: "do_31428800441775562190477",
    title: "Handloom Cooperative: GI Tag Documentation and Pricing",
    subject: "Social Science",
    language: "Bengali",
    license: "CC BY 4.0",
    copyright: "NCERT",
    size_mb: 68.4,
    video_url: "https://diksha.gov.in/play/content/do_31428800441775562190477",
  },
  {
    identifier: "do_31439077122886931578106",
    title: "Fisheries Cooperatives: Catch Aggregation and Welfare Scheme Disbursal",
    subject: "Science",
    language: "Malayalam",
    license: "CC BY 4.0",
    copyright: "NCERT",
    size_mb: 88.9,
    video_url: "https://diksha.gov.in/play/content/do_31439077122886931578106",
  },
  {
    identifier: "do_31447790331155344026985",
    title: "Leadership for Cooperative Boards: Conflict Resolution at Meetings",
    subject: "Social Science",
    language: "English",
    license: "CC BY 4.0",
    copyright: "NCERT",
    size_mb: 104.6,
    video_url: "https://diksha.gov.in/play/content/do_31447790331155344026985",
  },
  {
    identifier: "do_31456228870066405517394",
    title: "Cooperative Computerisation: Core Banking and Member Passbook Digitisation",
    subject: "Computer Science",
    language: "Hindi",
    license: "CC BY 4.0",
    copyright: "NCERT",
    size_mb: 132.2,
    video_url: "https://diksha.gov.in/play/content/do_31456228870066405517394",
  },
];

function haystack(record: CatalogueRecord): string {
  return `${record.title} ${record.subject} ${record.copyright} ${record.language}`.toLowerCase();
}

/** Local match of the DIKSHA query semantics: every term must appear somewhere. */
export function searchCatalogue(
  query: string,
  subject: string | undefined,
  limit: number,
  offset: number,
): CatalogueRecord[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const matched = DIKSHA_CATALOGUE.filter((record) => {
    if (subject && record.subject !== subject) return false;
    const text = haystack(record);
    return terms.every((term) => text.includes(term));
  });
  return matched.slice(offset, offset + limit);
}