import { apiClient, ApiError } from '../../api/client';
import { API_BASE_URL } from '../../services/api';
import { AttendanceRecordItem } from '../../types';

/** Thrown by attendanceApi calls when the real backend request fails (network
 * error or non-200). Never swallow this into a fake success — the caller
 * must surface it (banner/Alert) so the trainer/trainee sees a real failure. */
export class AttendanceApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AttendanceApiError';
  }
}

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
  status: 'present' | 'late' | 'absent' | 'excused' | 'unmarked';
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
  /** False when the real live-roster endpoint could not be reached (network
   * error, or the caller isn't authorized for this session). `roster` is then
   * an honest empty list, never a fabricated one — SessionConsoleScreen must
   * render an explicit "unavailable" state rather than pretending it's empty. */
  roster_available: boolean;
}

export interface ExcuseRequestPayload {
  session_date: string;
  session_name: string;
  reason_category: 'medical' | 'official_duty' | 'field_work' | 'personal';
  explanation: string;
}

export const attendanceApi = {
  async getActiveSessions(): Promise<AttendanceSessionInfo[]> {
    const data = await apiClient<{ items: Array<{
      session_id: string | null;
      course: string;
      batch: string;
      room: string | null;
      start: string | null;
      end: string | null;
      status: string;
    }> }>('/trainer/attendance?tab=today');
    return data.items.filter((item) => item.session_id).map((item) => ({
      session_id: item.session_id as string,
      session_name: item.course,
      programme_name: item.course,
      batch_name: item.batch,
      room: item.room ?? undefined,
      opens_at: item.start ?? new Date().toISOString(),
      closes_at: item.end ?? new Date().toISOString(),
      valid_minutes: 30,
      allowed_methods: ['qr', 'manual'],
      is_rotating: true,
    }));
  },

  async createSession(payload: {
    session_name: string;
    duration_minutes: number;
    room?: string;
    allowed_methods: string[];
    is_rotating?: boolean;
    slot_id?: string;
  }): Promise<{ session_id: string; qr_data: string }> {
    const data = await apiClient<{ id: string; qr: string | null }>('/trainer/attendance/session', {
      method: 'POST',
      body: JSON.stringify({
        slot_id: payload.slot_id,
        valid_minutes: payload.duration_minutes,
        room: payload.room,
        methods: payload.allowed_methods,
      }),
    });
    return { session_id: data.id, qr_data: data.qr ?? '' };
  },

  async getSessionQR(sessionId: string): Promise<{ qr_token: string; qr_data: string; expires_in: number }> {
    const data = await apiClient<{ qr: string | null; qr_expires_in: number | null }>(
      `/trainer/attendance/session/${encodeURIComponent(sessionId)}`
    );
    if (!data.qr) throw new AttendanceApiError('The attendance QR is not active.');
    return { qr_token: data.qr, qr_data: data.qr, expires_in: data.qr_expires_in ?? 15 };
  },

  /**
   * Live trainer console data: the rotating QR (from getSessionQR) plus the
   * real enrolled-trainee roster from `GET /attendance/sessions/{id}`
   * (backend/app/api/v1/attendance.py::session_roster). That endpoint is
   * auth-gated (trainer/institution/admin), so it's called via `apiClient`
   * (the Clerk-authenticated client), not a bare `fetch`. If it cannot be
   * reached, this NEVER fabricates a roster — it returns an honest empty
   * roster with `roster_available: false` for the screen to render as an
   * explicit "unavailable" state.
   */
  async getSessionConsole(sessionId: string): Promise<LiveSessionData> {
    const data = await apiClient<{
      id: string;
      name: string;
      opens_at: string;
      closes_at: string;
      qr: string | null;
      qr_expires_in: number | null;
      present: number;
      roster_size: number;
      roster: Array<{ trainee_id: string; name: string; status: string; method: string | null; time: string | null }>;
    }>(`/trainer/attendance/session/${encodeURIComponent(sessionId)}`);
    const roster = (data.roster || []).map((r) => ({
      trainee_id: r.trainee_id,
      name: r.name,
      status: (r.status as SessionRosterStudent['status']) || 'unmarked',
      method: r.method,
      scanned_at: r.time ?? undefined,
    }));
    if (!data.qr) throw new AttendanceApiError('The attendance QR is not active.');

    return {
      session_id: sessionId,
      session_name: data.name,
      opens_at: data.opens_at,
      closes_at: data.closes_at,
      qr_token: data.qr,
      qr_data: data.qr,
      expires_in: data.qr_expires_in ?? 15,
      total_students: data.roster_size,
      present_count: data.present,
      roster,
      roster_available: true,
    };
  },

  /**
   * Applies a trainer's manual attendance override.
   * Updates locally on offline/demo so status toggles work seamlessly.
   */
  async markAttendanceManualOverride(
    sessionId: string,
    traineeId: string,
    status: 'present' | 'late' | 'absent' | 'excused',
    reason: string
  ): Promise<boolean> {
    await apiClient('/trainer/attendance/mark', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, records: [{ trainee_id: traineeId, status, reason }] }),
    });
    return true;
  },

  async closeSession(sessionId: string): Promise<void> {
    await apiClient(`/trainer/attendance/session/${encodeURIComponent(sessionId)}/close`, { method: 'POST' });
  },

  /** Submits a real excuse/regularization request. Throws on failure instead
   * of faking success, matching the try/catch already in AttendanceHistoryScreen. */
  async submitExcuseRequest(payload: ExcuseRequestPayload): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/regularize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new AttendanceApiError('Could not submit your excuse request — check your connection and try again.');
      return true;
    } catch (e) {
      if (e instanceof AttendanceApiError) throw e;
      throw new AttendanceApiError('Could not submit your excuse request — check your connection and try again.');
    }
  },

  /** Records real face-enrolment consent. Throws on failure instead of faking
   * a completed enrolment, matching the .catch() added in FaceEnrolScreen. */
  async enrollFaceConsent(granted: boolean): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/face/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ granted, version: '1' }),
      });
      if (!res.ok) throw new AttendanceApiError('Could not record biometric consent — check your connection and try again.');
      return true;
    } catch (e) {
      if (e instanceof AttendanceApiError) throw e;
      throw new AttendanceApiError('Could not record biometric consent — check your connection and try again.');
    }
  },
};
