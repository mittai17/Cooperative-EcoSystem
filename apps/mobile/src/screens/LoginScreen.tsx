import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useClerk } from '@clerk/expo';
import { useSignIn, useSignUp } from '@clerk/expo/legacy';
import { COLORS, HIT, ICON, SPACE, TEXT, RADII } from '../constants/theme';
import { SUPPORTED_ROLES } from '../constants/auth';
import {
  GraduationCap,
  Eye,
  EyeOff,
  Mail,
  Lock,
  KeyRound,
  ShieldCheck,
  Users,
  Building2,
  Briefcase,
  Shield,
  ChevronRight,
} from 'lucide-react-native';
import { Button } from '../components/Button';
import { FIELD_ICON, TextField } from '../components/TextField';
import { authApi, DemoAccount } from '../services/api';
import { describeAuthError } from '../services/authErrors';
import { useAuthContext } from '../navigation/AuthContext';

type Mode = 'signin' | 'signup' | 'verify-signup' | 'verify-signin';

const MIN_PASSWORD = 15; // enforced by the Clerk instance; checked here for a faster message

const CAPTION: Record<Mode, string> = {
  signin: 'Sign in to continue',
  signup: 'Create your account',
  'verify-signup': 'Verify your email',
  'verify-signin': 'Verify this device',
};

const ROLE_META: Record<string, { label: string; icon: any; color: string; desc: string }> = {
  trainee: {
    label: 'Trainee / Learner',
    icon: GraduationCap,
    color: '#D8232A',
    desc: 'Skill Passport, courses & job applications',
  },
  trainer: {
    label: 'Trainer / Faculty',
    icon: Users,
    color: '#0284C7',
    desc: 'Attendance sessions, class roster & grading',
  },
  institution: {
    label: 'Cooperative Institution',
    icon: Building2,
    color: '#7C3AED',
    desc: 'Programmes, nominations & campus operations',
  },
  employer: {
    label: 'Employer / Society',
    icon: Briefcase,
    color: '#D97706',
    desc: 'Job postings, candidates & hire feedback',
  },
  admin: {
    label: 'NCCT Administrator',
    icon: Shield,
    color: '#059669',
    desc: 'National oversight, demand & institution analytics',
  },
};

export const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const clerk = useClerk();
  const { isLoaded: signInLoaded, signIn } = useSignIn();
  const { isLoaded: signUpLoaded, signUp } = useSignUp();
  const { notice, clearNotice, signOut } = useAuthContext();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState<'form' | 'resend' | string | null>(null);
  const [error, setError] = useState('');
  const [demoError, setDemoError] = useState('');
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const passwordRef = useRef<TextInput>(null);

  const ready = signInLoaded && signUpLoaded;

  useEffect(() => {
    let active = true;
    authApi.demoAccounts().then((res) => {
      if (!active || !res.enabled) return;
      setDemoAccounts(res.accounts.filter((a) => SUPPORTED_ROLES.includes(a.role)));
    });
    return () => {
      active = false;
    };
  }, []);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setDemoError('');
    setCode('');
    if (next === 'signin' || next === 'signup') setShowPw(false);
  };

  const beginAction = (kind: string) => {
    clearNotice();
    setError('');
    setDemoError('');
    setBusy(kind);
  };

  const handleSignIn = async () => {
    if (!signIn || !clerk.setActive || busy) return;
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    beginAction('form');
    try {
      const attempt = await signIn.create({ identifier: email.trim(), password });
      if (attempt.status === 'complete') {
        await clerk.setActive({ session: attempt.createdSessionId });
        return; // the auth provider takes over
      }
      // New device: Clerk asks for an email code as a second factor.
      const factors = attempt.supportedSecondFactors ?? [];
      const canEmail = factors.some((f) => f.strategy === 'email_code');
      if ((attempt.status === 'needs_client_trust' || attempt.status === 'needs_second_factor') && canEmail) {
        await signIn.prepareSecondFactor({ strategy: 'email_code' });
        switchMode('verify-signin');
        return;
      }
      setError('This account needs an extra verification step that this app does not support.');
    } catch (e) {
      setError(describeAuthError(e, 'Could not sign in. Try again.'));
    } finally {
      setBusy(null);
    }
  };

  const handleSignUp = async () => {
    if (!signUp || busy) return;
    if (!email.trim() || !password) {
      setError('Enter an email and a password.');
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    beginAction('form');
    try {
      await signUp.create({ emailAddress: email.trim(), password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      switchMode('verify-signup');
    } catch (e) {
      setError(describeAuthError(e, 'Could not create the account. Try again.'));
    } finally {
      setBusy(null);
    }
  };

  const handleVerify = async () => {
    if (busy) return;
    const trimmed = code.trim();
    if (trimmed.length < 6) {
      setError('Enter the 6-digit code from the email.');
      return;
    }
    beginAction('form');
    try {
      if (mode === 'verify-signup') {
        if (!signUp || !clerk.setActive) return;
        const attempt = await signUp.attemptEmailAddressVerification({ code: trimmed });
        if (attempt.status === 'complete') {
          await clerk.setActive({ session: attempt.createdSessionId });
          return;
        }
        setError('Sign-up needs more information that this app cannot collect yet.');
      } else {
        if (!signIn || !clerk.setActive) return;
        const attempt = await signIn.attemptSecondFactor({ strategy: 'email_code', code: trimmed });
        if (attempt.status === 'complete') {
          await clerk.setActive({ session: attempt.createdSessionId });
          return;
        }
        setError('Verification did not complete. Request a new code.');
      }
    } catch (e) {
      setError(describeAuthError(e, 'Could not verify the code. Try again.'));
    } finally {
      setBusy(null);
    }
  };

  const handleResend = async () => {
    if (busy) return;
    beginAction('resend');
    try {
      if (mode === 'verify-signup') await signUp?.prepareEmailAddressVerification({ strategy: 'email_code' });
      else await signIn?.prepareSecondFactor({ strategy: 'email_code' });
      setCode('');
    } catch (e) {
      setError(describeAuthError(e, 'Could not send a new code. Try again.'));
    } finally {
      setBusy(null);
    }
  };

  const handleDemo = async (account: DemoAccount) => {
    if (!signIn || !clerk.setActive || busy) return;
    beginAction(`demo:${account.role}`);
    let ticket: string;
    try {
      ticket = await authApi.demoLogin(account.role);
    } catch (e) {
      setDemoError(e instanceof Error ? e.message : 'Demo sign-in is not available right now.');
      setBusy(null);
      return;
    }
    try {
      let attempt;
      try {
        attempt = await signIn.create({ strategy: 'ticket', ticket });
      } catch (err: unknown) {
        const msg = String(err);
        if (msg.includes('already signed in') || (err as { errors?: { code?: string }[] })?.errors?.[0]?.code === 'session_exists') {
          await signOut();
          attempt = await signIn.create({ strategy: 'ticket', ticket });
        } else {
          throw err;
        }
      }
      if (attempt.status !== 'complete') {
        setDemoError(`Demo sign-in did not complete (status: ${attempt.status}).`);
        return;
      }
      await clerk.setActive({ session: attempt.createdSessionId });
    } catch (e) {
      setDemoError(`Demo sign-in failed at the ticket exchange. ${describeAuthError(e, 'Clerk rejected the ticket.')}`);
    } finally {
      setBusy(null);
    }
  };

  const isVerify = mode === 'verify-signup' || mode === 'verify-signin';
  const formBusy = busy === 'form';
  const banner = error || notice || '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandSection}>
            <View style={styles.logo}>
              <GraduationCap size={ICON.lg} color={COLORS.textInverse} />
            </View>
            <Text style={styles.appName}>CoopSetu AI</Text>
            <Text style={styles.caption}>{CAPTION[mode]}</Text>
          </View>

          <View style={styles.form}>
            {isVerify ? (
              <>
                <Text style={styles.body}>
                  We sent a 6-digit code to <Text style={styles.bodyStrong}>{email.trim()}</Text>.
                </Text>
                <TextField
                  label="Verification code"
                  icon={<KeyRound {...FIELD_ICON} />}
                  value={code}
                  onChangeText={(t) => {
                    setCode(t.replace(/\D/g, '').slice(0, 6));
                    setError('');
                  }}
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  maxLength={6}
                  returnKeyType="done"
                  onSubmitEditing={handleVerify}
                />
              </>
            ) : (
              <>
                <TextField
                  label="Email"
                  icon={<Mail {...FIELD_ICON} />}
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    setError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
                <TextField
                  ref={passwordRef}
                  label="Password"
                  icon={<Lock {...FIELD_ICON} />}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setError('');
                  }}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  textContentType={mode === 'signup' ? 'newPassword' : 'password'}
                  returnKeyType="done"
                  onSubmitEditing={mode === 'signup' ? handleSignUp : handleSignIn}
                  hint={mode === 'signup' ? `At least ${MIN_PASSWORD} characters.` : undefined}
                  trailing={{
                    label: showPw ? 'Hide password' : 'Show password',
                    onPress: () => setShowPw((v) => !v),
                    icon: showPw ? (
                      <EyeOff size={ICON.md} color={COLORS.textMuted} />
                    ) : (
                      <Eye size={ICON.md} color={COLORS.textMuted} />
                    ),
                  }}
                />
              </>
            )}

            {banner ? (
              <Text style={[styles.message, !error && styles.notice]} accessibilityRole="alert">
                {banner}
              </Text>
            ) : null}

            {mode === 'signin' ? (
              <Button label="Sign in" onPress={handleSignIn} loading={formBusy} disabled={!ready || !!busy} />
            ) : null}
            {mode === 'signup' ? (
              <Button label="Create account" onPress={handleSignUp} loading={formBusy} disabled={!ready || !!busy} />
            ) : null}
            {isVerify ? (
              <>
                <Button label="Verify" onPress={handleVerify} loading={formBusy} disabled={!ready || !!busy} />
                <Button
                  label="Send a new code"
                  variant="secondary"
                  onPress={handleResend}
                  loading={busy === 'resend'}
                  disabled={!!busy}
                />
              </>
            ) : null}

            <TouchableOpacity
              style={styles.link}
              onPress={() => (mode === 'signin' ? navigation.navigate('Register') : switchMode('signin'))}
              disabled={!!busy}
              accessibilityRole="button"
            >
              <Text style={styles.linkText}>
                {mode === 'signin' ? "Don't have an account? Create account" : isVerify ? 'Start over' : 'Back to sign in'}
              </Text>
            </TouchableOpacity>
          </View>

          {mode === 'signin' && demoAccounts.length > 0 ? (
            <View style={styles.demo}>
              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>Demo accounts by role</Text>
                <View style={styles.divider} />
              </View>
              <Text style={styles.caption}>Explore the full ecosystem with role-specific accounts:</Text>
              
              <View style={styles.demoList}>
                {demoAccounts.map((a) => {
                  const meta = ROLE_META[a.role] || {
                    label: a.role,
                    icon: GraduationCap,
                    color: COLORS.primary,
                    desc: 'Explore CoopSetu AI',
                  };
                  const Icon = meta.icon;
                  const isRoleBusy = busy === `demo:${a.role}`;
                  return (
                    <TouchableOpacity
                      key={a.role}
                      style={[styles.demoCard, isRoleBusy && styles.demoCardBusy]}
                      onPress={() => handleDemo(a)}
                      disabled={!ready || !!busy}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Continue as ${a.name}, ${meta.label}`}
                    >
                      <View style={[styles.demoIconWrap, { backgroundColor: meta.color + '15' }]}>
                        <Icon size={20} color={meta.color} />
                      </View>
                      <View style={styles.demoContent}>
                        <View style={styles.demoTitleRow}>
                          <Text style={styles.demoName} numberOfLines={1}>
                            {a.name}
                          </Text>
                          <View style={[styles.roleBadge, { backgroundColor: meta.color + '18' }]}>
                            <Text style={[styles.roleBadgeText, { color: meta.color }]}>
                              {meta.label}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.demoDesc} numberOfLines={1}>
                          {meta.desc}
                        </Text>
                      </View>
                      {isRoleBusy ? (
                        <ActivityIndicator size="small" color={meta.color} />
                      ) : (
                        <ChevronRight size={18} color={COLORS.textMuted} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {demoError ? (
                <Text style={styles.message} accessibilityRole="alert">
                  {demoError}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.publicSection}>
            <TouchableOpacity
              style={styles.verifyBtn}
              onPress={() => navigation.navigate('VerifyCertificate')}
              accessibilityRole="button"
              accessibilityLabel="Verify an official certificate"
            >
              <ShieldCheck size={18} color={COLORS.primary} />
              <Text style={styles.verifyBtnText}>Verify Certificate (Public Access)</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACE.lg,
    gap: SPACE.xl,
  },
  brandSection: { alignItems: 'center', gap: SPACE.sm },
  logo: {
    width: 56,
    height: 56,
    borderRadius: RADII.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: { ...TEXT.title },
  caption: { ...TEXT.body, color: COLORS.textSecondary },
  body: { ...TEXT.body, color: COLORS.textSecondary },
  bodyStrong: { ...TEXT.bodyStrong },
  form: { gap: SPACE.md },
  message: { ...TEXT.caption, color: COLORS.danger },
  notice: { color: COLORS.textSecondary },
  link: { minHeight: HIT, alignItems: 'center', justifyContent: 'center' },
  linkText: { ...TEXT.bodyStrong, color: COLORS.primary },
  demo: { gap: SPACE.sm },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  divider: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { ...TEXT.captionStrong },
  demoList: { gap: SPACE.sm, marginTop: SPACE.xs },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    padding: SPACE.md,
    gap: SPACE.md,
  },
  demoCardBusy: {
    opacity: 0.7,
    borderColor: COLORS.primary,
  },
  demoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoContent: {
    flex: 1,
    gap: 2,
  },
  demoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.xs,
  },
  demoName: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADII.pill,
  },
  roleBadgeText: {
    ...TEXT.captionStrong,
    fontSize: 10,
    lineHeight: 14,
  },
  demoDesc: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
  publicSection: { alignItems: 'center', marginTop: SPACE.sm },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    paddingVertical: SPACE.xs,
    paddingHorizontal: SPACE.md,
  },
  verifyBtnText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },
});
