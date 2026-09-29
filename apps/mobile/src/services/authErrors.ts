import { isClerkAPIResponseError, isClerkRuntimeError } from '@clerk/expo';

const BY_CODE: Record<string, string> = {
  // Deliberately identical for unknown email and wrong password (no account enumeration).
  form_identifier_not_found: 'Incorrect email or password.',
  form_password_incorrect: 'Incorrect email or password.',
  form_param_format_invalid: 'Enter a valid email address.',
  form_param_nil: 'Fill in every field.',
  form_password_length_too_short: 'Password must be at least 15 characters.',
  form_password_pwned: 'That password appears in a known data breach. Choose a different one.',
  form_password_not_strong_enough: 'Choose a stronger password.',
  form_password_size_in_bytes_exceeded: 'That password is too long.',
  form_identifier_exists: 'An account with this email already exists. Sign in instead.',
  form_code_incorrect: 'That code is incorrect. Check the email and try again.',
  verification_expired: 'That code has expired. Request a new one.',
  verification_failed: 'Too many incorrect codes. Request a new one.',
  strategy_for_user_invalid: 'This account cannot sign in with a password.',
  too_many_requests: 'Too many attempts. Wait a minute and try again.',
  session_exists: 'You are already signed in.',
};

/** Maps a thrown Clerk / network error to a short inline message. */
export function describeAuthError(error: unknown, fallback: string): string {
  if (isClerkAPIResponseError(error)) {
    if (error.status === 429) return BY_CODE.too_many_requests;
    for (const e of error.errors) {
      if (BY_CODE[e.code]) return BY_CODE[e.code];
    }
    const first = error.errors[0];
    return first?.longMessage || first?.message || fallback;
  }
  if (isClerkRuntimeError(error)) {
    if (error.code === 'network_error') return 'Could not reach the sign-in service. Check your connection.';
    return error.message || fallback;
  }
  if (error instanceof TypeError) return 'Could not reach the sign-in service. Check your connection.';
  return fallback;
}
