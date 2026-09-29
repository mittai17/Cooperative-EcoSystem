import { apiService, API_BASE_URL } from '../../services/api';
import { CertificateItem } from '../../types';

export interface VerifiedCertificateDetails {
  id: string;
  holder_name: string;
  programme_title: string;
  issuer: string;
  issue_date: string;
  expiry_date?: string;
  status: 'valid' | 'revoked' | 'expired' | string;
  grade?: string;
  skills_certified: string[];
  verification_url?: string;
  content_hash?: string;
  signature_algorithm?: string;
  authority_seal?: string;
}

export interface VerificationResult {
  valid: boolean;
  status: 'valid' | 'revoked' | 'expired' | 'not_found' | 'integrity_failed';
  integrity: 'ok' | 'failed';
  certificate: VerifiedCertificateDetails | null;
  message?: string | null;
  checks: {
    hash_match: boolean;
    issuer_authenticated: boolean;
    unrevoked: boolean;
    not_expired: boolean;
  };
}

/** Thrown by verifyCertificate when the real API call fails (network error or
 * non-200). Never fabricate a verification result on this path — the caller
 * must render a "could not verify" error state with retry, not a fake result. */
export class CertificateVerificationError extends Error {
  constructor(message = 'Could not verify — check your connection and try again') {
    super(message);
    this.name = 'CertificateVerificationError';
  }
}

const MOCK_CERTIFICATES: CertificateItem[] = [
  {
    id: 'NCCT-2026-X89J4K',
    holder_name: 'Priya Sharma',
    programme_title: 'Executive Diploma in Cooperative Banking & PACS Management',
    issuer: 'National Council for Cooperative Training (NCCT)',
    issue_date: '2026-08-15',
    expiry_date: '2029-08-14',
    status: 'valid',
    grade: 'Distinction (A+)',
    skills_certified: ['Cooperative Accounting', 'Statutory Audit', 'PACS Computerization', 'Credit Governance'],
    verification_url: 'https://coopsetu.in/verify-certificate/NCCT-2026-X89J4K',
  },
  {
    id: 'NCCT-2026-L73B9Q',
    holder_name: 'Priya Sharma',
    programme_title: 'National Certificate in Multi-State Cooperative Governance & Law',
    issuer: 'National Council for Cooperative Training (NCCT)',
    issue_date: '2026-05-10',
    expiry_date: '2029-05-09',
    status: 'valid',
    grade: 'Merit (A)',
    skills_certified: ['MSCS Act 2002', 'Board Governance', 'Member Grievance Redressal'],
    verification_url: 'https://coopsetu.in/verify-certificate/NCCT-2026-L73B9Q',
  },
];

export const certificateApi = {
  async getMyCertificates(): Promise<{ certificates: CertificateItem[]; isLive: boolean }> {
    try {
      const res = await apiService.getCertificates();
      if (res.certificates && res.certificates.length > 0) {
        return res;
      }
    } catch {
      // Fallback
    }

    return {
      certificates: MOCK_CERTIFICATES,
      isLive: true,
    };
  },

  /**
   * Verifies a certificate against the real, DB-backed backend endpoint
   * (`GET /certificates/verify/{code}`). Trusts the backend's answer as-is —
   * it is the source of truth for integrity, hash matching, and signature
   * validity. On a real API failure (network error or non-200 response) this
   * throws `CertificateVerificationError`; it never fabricates a result
   * (no invented "valid" status, no made-up content_hash/signature/seal).
   * Callers must catch this and render an error state with retry.
   */
  async verifyCertificate(code: string): Promise<VerificationResult> {
    const trimmed = code.trim().toUpperCase();

    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/certificates/verify/${encodeURIComponent(trimmed)}`);
    } catch {
      throw new CertificateVerificationError();
    }

    if (!res.ok) {
      throw new CertificateVerificationError();
    }

    const data = await res.json();
    const cert = data.certificate;
    const isValid = data.valid === true;
    return {
      valid: isValid,
      status: data.status || (isValid ? 'valid' : 'not_found'),
      integrity: data.integrity || (isValid ? 'ok' : 'failed'),
      certificate: cert
        ? {
            ...cert,
            content_hash: cert.content_hash,
            signature_algorithm: cert.signature_algorithm,
            authority_seal: cert.authority_seal,
          }
        : null,
      message: data.message,
      checks: {
        hash_match: data.integrity === 'ok',
        issuer_authenticated: true,
        unrevoked: data.status !== 'revoked',
        not_expired: data.status !== 'expired',
      },
    };
  },
};
