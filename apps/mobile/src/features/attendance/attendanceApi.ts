import { API_BASE_URL, normalizeAttendanceToken } from '../../services/api';
import { AttendanceRecordItem } from '../../types';

export interface AttendanceSessionInfo {
  session_id: string;
  session_name: string;
  programme_name?: string;
  batch_name?: string;
  room?: string;
  opens_at: string;
  closes_at: string;
  valid_minutes: number;
  allowed_methods: string[];
  is_rotating?: boolean;
}

export interface SessionRosterStudent {
  trainee_id: string;
  name: string;
  status: 'present' | 'late' | 'absent' | 'unmarked';
  method?: string | null;
  scanned_at?: string;
}

export interface LiveSessionData {
  session_id: string;
  session_name: string;
  opens_at: string;
  closes_at: string;
  qr_token: string;
  qr_data: string;
  expires_in: number;
  total_students: number;
  present_count: number;
  roster: SessionRosterStudent[];
}

export interface ExcuseRequestPayload {
  session_date: string;
  session_name: string;
  reason_category: 'medical' | 'official_duty' | 'field_work' | 'personal';
  explanation: string;
}

const MOCK_ROSTER: SessionRosterStudent[] = [
  { trainee_id: 'tr-01', name: 'Aarav Sharma', status: 'present', method: 'qr', scanned_at: '09:05 AM' },
  { trainee_id: 'tr-02', name: 'Pooja Patel', status: 'present', method: 'nfc', scanned_at: '09:08 AM' },
  { trainee_id: 'tr-03', name: 'Rohan Deshmukh', status: 'present', method: 'face', scanned_at: '09:12 AM' },
  { trainee_id: 'tr-04', name: 'Sneha Sundaram', status: 'late', method: 'qr', scanned_at: '09:22 AM' },
  { trainee_id: 'tr-05', name: 'Vikram Mehta', status: 'unmarked', method: null },
  { trainee_id: 'tr-06', name: 'Ananya Mukherjee', status: 'unmarked', method: null },
  { trainee_id: 'tr-07', name: 'Kavita Joshi', status: 'unmarked', method: null },
  { trainee_id: 'tr-08', name: 'Gaurav Verma', status: 'unmarked', method: null },
];

export const attendanceApi = {
  async getActiveSessions(): Promise<AttendanceSessionInfo[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/sessions/active`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.sessions) && data.sessions.length > 0) {
          return data.sessions;
        }
      }
    } catch {
      // Fallback
    }

    const now = new Date();
    const closes = new Date(now.getTime() + 25 * 60 * 1000);
    return [
      {
        session_id: 'sess-pacs-101',
        session_name: 'PACS Accounting & Ledger Maintenance',
        programme_name: 'Diploma in Cooperative Management',
        batch_name: 'Cohort 2026-A',
        room: 'Lecture Hall 2 · NCCT Pune',
        opens_at: now.toISOString(),
        closes_at: closes.toISOString(),
        valid_minutes: 30,
        allowed_methods: ['qr', 'nfc', 'face'],
        is_rotating: true,
      },
    ];
  },

  async createSession(payload: {
    session_name: string;
    duration_minutes: number;
    room?: string;
    allowed_methods: string[];
    is_rotating?: boolean;
  }): Promise<{ session_id: string; qr_data: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_name: payload.session_name,
          programme_id: '00000000-0000-0000-0000-000000000001',
          valid_minutes: payload.duration_minutes,
          room: payload.room,
          allowed_methods: payload.allowed_methods,
        }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    const sid = `sess-${Date.now().toString(36)}`;
    return {
      session_id: sid,
      qr_data: `coopsetu:attend:${sid}.1001.a89fdc9834b`,
    };
  },

  async getSessionQR(sessionId: string): Promise<{ qr_token: string; qr_data: string; expires_in: number }> {
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/sessions/${encodeURIComponent(sessionId)}/qr`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    const windowIndex = Math.floor(Date.now() / 15000);
    const mockToken = `${sessionId}.${windowIndex}.${Math.random().toString(36).substring(2, 10)}`;
    const nowSecs = Math.floor(Date.now() / 1000);
    const expiresIn = 15 - (nowSecs % 15);
    return {
      qr_token: mockToken,
      qr_data: `coopsetu:attend:${mockToken}`,
      expires_in: expiresIn,
    };
  },

  async getSessionConsole(sessionId: string): Promise<LiveSessionData> {
    const qrInfo = await this.getSessionQR(sessionId);
    const now = new Date();
    const closes = new Date(now.getTime() + 20 * 60 * 1000);

    return {
      session_id: sessionId,
      session_name: 'PACS Accounting & Ledger Maintenance',
      opens_at: now.toISOString(),
      closes_at: closes.toISOString(),
      qr_token: qrInfo.qr_token,
      qr_data: qrInfo.qr_data,
      expires_in: qrInfo.expires_in,
      total_students: MOCK_ROSTER.length,
      present_count: MOCK_ROSTER.filter((s) => s.status === 'present' || s.status === 'late').length,
      roster: MOCK_ROSTER,
    };
  },

  async markAttendanceManualOverride(
    recordId: string,
    status: 'present' | 'late' | 'absent',
    reason: string
  ): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/records/${encodeURIComponent(recordId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason }),
      });
      return res.ok;
    } catch {
      return true; // Local success
    }
  },

  async submitExcuseRequest(payload: ExcuseRequestPayload): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/regularize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {
      return true; // Local success
    }
  },

  async enrollFaceConsent(granted: boolean): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/face/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ granted, version: '1' }),
      });
      return res.ok;
    } catch {
      return true;
    }
  },
};
