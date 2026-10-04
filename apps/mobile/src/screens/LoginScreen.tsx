import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useClerk } from '@clerk/expo';
import { useSignIn, useSignUp } from '@clerk/expo/legacy';
import { COLORS, ICON, SPACE, TEXT, RADII, CARD } from '../constants/theme';
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
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { Button } from '../components/Button';
import { NurvexLogo } from '../components/NurvexLogo';
import { FIELD_ICON, TextField } from '../components/TextField';
import { describeAuthError } from '../services/authErrors';
import { useAuthContext } from '../navigation/AuthContext';
import { DEMO_ROLE_LIST, DemoRoleConfig } from '../constants/demoProfiles';

type Mode = 'signin' | 'signup' | 'verify-signup' | 'verify-signin';

const MIN_PASSWORD = 15;

const CAPTION: Record<Mode, string> = {
  signin: 'Cooperative Training & Employment Network',
  signup: 'Create your account',
  'verify-signup': 'Verify your email',
  'verify-signin': 'Verify this device',
};

const ROLE_ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  trainee: GraduationCap,
  institution: Building2,
  trainer: Users,
  employer: Briefcase,
  admin: Shield,
};

export const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const clerk = useClerk();
  const { isLoaded: signInLoaded, signIn } = useSignIn();
  const { isLoaded: signUpLoaded, signUp } = useSignUp();
  const { notice, clearNotice, setDemoRole } = useAuthContext();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState<'form' | 'resend' | string | null>(null);
  const [error, setError] = useState('');
  const [showClerkForm, setShowClerkForm] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const ready = signInLoaded && signUpLoaded;

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setCode('');
    if (next === 'signin' || next === 'signup') setShowPw(false);
  };

  const beginAction = (kind: string) => {
    clearNotice();
    setError('');
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
        return;
      }
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

  const handleDemoSelect = (item: DemoRoleConfig) => {
    clearNotice();
    setError('');
    // Instant 1-tap demo login bypassing Clerk
    setDemoRole(item.role);
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
          {/* Brand Banner */}
          <View style={styles.brandSection}>
            <NurvexLogo size="lg" showTagline />
            <Text style={styles.caption}>{CAPTION[mode]}</Text>
          </View>

          {/* Quick Demo Access Section (Prominent 1-Tap Tiles) */}
          <View style={styles.demoSection}>
            <View style={styles.demoHeader}>
              <View style={styles.demoSparkleBox}>
                <Sparkles size={ICON.sm} color={COLORS.primary} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.demoHeaderTitle}>Quick Demo Access</Text>
                <Text style={styles.demoHeaderSubtitle}>No password needed · 1-Tap instant login</Text>
              </View>
            </View>

            <View style={styles.demoTilesList}>
              {DEMO_ROLE_LIST.map((item) => {
                const IconComp = ROLE_ICONS[item.role] || GraduationCap;
                return (
                  <TouchableOpacity
                    key={item.role}
                    style={styles.demoTile}
                    onPress={() => handleDemoSelect(item)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={`Login as ${item.name} (${item.role})`}
                  >
                    <View style={[styles.tileIconBox, { backgroundColor: item.color + '15' }]}>
                      <IconComp size={ICON.lg} color={item.color} />
                    </View>

                    <View style={styles.tileInfo}>
                      <View style={styles.tileNameRow}>
                        <Text style={styles.tileName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <View style={[styles.tileRoleBadge, { backgroundColor: item.color + '18' }]}>
                          <Text style={[styles.tileRoleText, { color: item.color }]}>
                            {item.role.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.tileAffiliation} numberOfLines={1}>
                        {item.affiliation}
                      </Text>

                      <Text style={styles.tileTagline} numberOfLines={1}>
                        {item.tagline}
                      </Text>
                    </View>

                    <ChevronRight size={ICON.md} color={COLORS.primary} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Regular Account Sign In (Expandable / Below) */}
          <View style={styles.clerkAccordion}>
            <TouchableOpacity
              style={styles.clerkAccordionHeader}
              onPress={() => setShowClerkForm((prev) => !prev)}
              activeOpacity={0.7}
            >
              <View style={styles.flex}>
                <Text style={styles.clerkAccordionTitle}>
                  {showClerkForm ? 'Hide Standard Sign In' : 'Sign in with Email / Password'}
                </Text>
                <Text style={styles.clerkAccordionSubtitle}>
                  For registered users with verified Clerk credentials
                </Text>
              </View>
              {showClerkForm ? (
                <ChevronUp size={ICON.md} color={COLORS.textSecondary} />
              ) : (
                <ChevronDown size={ICON.md} color={COLORS.textSecondary} />
              )}
            </TouchableOpacity>

            {showClerkForm ? (
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
            ) : null}
          </View>

          {/* Public Verification Shortcut */}
          <View style={styles.publicSection}>
            <TouchableOpacity
              style={styles.verifyBtn}
              onPress={() => navigation.navigate('VerifyCertificate')}
              accessibilityRole="button"
              accessibilityLabel="Verify an official certificate"
            >
              <ShieldCheck size={ICON.md} color={COLORS.primary} />
              <View style={styles.flex}>
                <Text style={styles.verifyTitle}>Verify NCCT Certificate</Text>
                <Text style={styles.verifySubtitle}>Check authenticity without signing in</Text>
              </View>
              <ChevronRight size={ICON.md} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACE.md,
    paddingTop: SPACE.md,
    paddingBottom: SPACE.xl,
    gap: SPACE.md,
  },
  brandSection: {
    alignItems: 'center',
    gap: SPACE.xs,
    paddingVertical: SPACE.xs,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACE.xs,
  },
  appName: {
    ...TEXT.title,
    fontSize: 26,
    color: COLORS.text,
  },
  caption: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  /* Demo Section */
  demoSection: {
    ...CARD,
    padding: SPACE.md,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.primaryLight,
    borderWidth: 1.5,
    gap: SPACE.sm,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingBottom: SPACE.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  demoSparkleBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoHeaderTitle: {
    ...TEXT.section,
    fontSize: 16,
    color: COLORS.text,
  },
  demoHeaderSubtitle: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
  demoTilesList: {
    gap: SPACE.sm,
    marginTop: SPACE.xs,
  },
  demoTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACE.sm + 2,
    gap: SPACE.sm + 2,
  },
  tileIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileInfo: {
    flex: 1,
  },
  tileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACE.xs,
  },
  tileName: {
    ...TEXT.bodyStrong,
    fontSize: 14,
  },
  tileRoleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADII.sm,
  },
  tileRoleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tileAffiliation: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
    fontSize: 12,
    marginTop: 1,
  },
  tileTagline: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },

  /* Clerk Accordion */
  clerkAccordion: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  clerkAccordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clerkAccordionTitle: {
    ...TEXT.bodyStrong,
    color: COLORS.text,
  },
  clerkAccordionSubtitle: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  form: {
    gap: SPACE.sm,
    paddingTop: SPACE.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  body: { ...TEXT.body },
  bodyStrong: { ...TEXT.bodyStrong },
  message: {
    ...TEXT.caption,
    color: COLORS.danger,
    paddingVertical: SPACE.xs,
  },
  notice: {
    color: COLORS.primary,
  },
  link: {
    alignItems: 'center',
    paddingVertical: SPACE.xs,
  },
  linkText: {
    ...TEXT.captionStrong,
    color: COLORS.primary,
  },

  /* Public Certificate Verification */
  publicSection: {
    ...CARD,
    padding: SPACE.sm + 2,
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  verifyTitle: {
    ...TEXT.bodyStrong,
    color: COLORS.text,
  },
  verifySubtitle: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
  },
});
