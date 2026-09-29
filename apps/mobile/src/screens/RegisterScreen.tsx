import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useClerk } from '@clerk/expo';
import { useSignUp } from '@clerk/expo/legacy';
import {
  GraduationCap,
  Users,
  Building2,
  Briefcase,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react-native';
import { COLORS, HIT, ICON, SPACE, TEXT, RADII } from '../constants/theme';
import { Button } from '../components/Button';
import { FIELD_ICON, TextField } from '../components/TextField';
import { authApi } from '../services/api';
import { describeAuthError } from '../services/authErrors';

const MIN_PASSWORD = 15;

export type RegisterRole = 'trainee' | 'trainer' | 'institution' | 'employer';

interface RoleOption {
  value: RegisterRole;
  label: string;
  description: string;
  icon: any;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'trainee',
    label: 'Trainee / Learner',
    description: 'Enrol in programmes, build your Skill Passport & find jobs',
    icon: GraduationCap,
  },
  {
    value: 'trainer',
    label: 'Trainer / Faculty',
    description: 'Manage classes, attendance, grading & assessments',
    icon: Users,
  },
  {
    value: 'institution',
    label: 'Cooperative Institution',
    description: 'Run programmes, nominate trainees, track outcomes',
    icon: Building2,
  },
  {
    value: 'employer',
    label: 'Employer / Society',
    description: 'Post jobs, discover verified skilled candidates',
    icon: Briefcase,
  },
];

const POPULAR_STATES = [
  'Maharashtra',
  'Gujarat',
  'Delhi',
  'Karnataka',
  'Tamil Nadu',
  'Uttar Pradesh',
  'Kerala',
  'West Bengal',
  'Rajasthan',
  'Madhya Pradesh',
  'Other State',
];

export const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const clerk = useClerk();
  const { isLoaded: signUpLoaded, signUp } = useSignUp();

  const [role, setRole] = useState<RegisterRole>('trainee');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [orgName, setOrgName] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'form' | 'verify'>('form');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const orgRef = useRef<TextInput>(null);
  const pwRef = useRef<TextInput>(null);
  const confirmPwRef = useRef<TextInput>(null);

  const orgLabel =
    role === 'trainee'
      ? 'College / Cooperative Society (optional)'
      : role === 'trainer'
      ? 'Institute / University Name'
      : role === 'institution'
      ? 'Institution / Training Centre Name'
      : 'Enterprise / Cooperative Society Name';

  const handleRegister = async () => {
    if (!signUp || busy) return;
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (role !== 'trainee' && !orgName.trim()) {
      setError('Please enter your organization name.');
      return;
    }
    if (!password) {
      setError('Please enter a password.');
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    setBusy('register');
    try {
      await signUp.create({
        emailAddress: email.trim(),
        password,
        firstName,
        lastName,
        unsafeMetadata: {
          role,
          organisation_name: orgName.trim(),
          state,
          phone: phone.trim(),
        },
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStage('verify');
    } catch (e) {
      setError(describeAuthError(e, 'Could not create your account. Try again.'));
    } finally {
      setBusy(null);
    }
  };

  const handleVerify = async () => {
    if (!signUp || !clerk.setActive || busy) return;
    const trimmed = code.trim();
    if (trimmed.length < 6) {
      setError('Enter the 6-digit verification code sent to your email.');
      return;
    }
    setBusy('verify');
    setError('');
    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code: trimmed });
      if (attempt.status === 'complete') {
        const userId = attempt.createdUserId;
        if (userId) {
          try {
            await authApi.syncUser({
              clerk_user_id: userId,
              email: email.trim(),
              full_name: fullName.trim(),
              role,
            });
          } catch {
            // Provision fallback occurs on first load
          }
        }
        await clerk.setActive({ session: attempt.createdSessionId });
        return;
      }
      setError(`Verification status: ${attempt.status}`);
    } catch (e) {
      setError(describeAuthError(e, 'Verification failed. Please check the code.'));
    } finally {
      setBusy(null);
    }
  };

  const handleResend = async () => {
    if (busy) return;
    setBusy('resend');
    try {
      await signUp?.prepareEmailAddressVerification({ strategy: 'email_code' });
      setCode('');
      setError('');
    } catch (e) {
      setError(describeAuthError(e, 'Could not resend code. Try again.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => (stage === 'verify' ? setStage('form') : navigation.goBack())}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={ICON.md} color={COLORS.primaryDark} />
            </TouchableOpacity>
            <View style={styles.headerTextCol}>
              <Text style={styles.title}>
                {stage === 'verify' ? 'Verify Email' : 'Create Account'}
              </Text>
              <Text style={styles.subtitle}>
                {stage === 'verify'
                  ? `Enter code sent to ${email.trim()}`
                  : 'Join the national cooperative learning & job ecosystem'}
              </Text>
            </View>
          </View>

          {stage === 'verify' ? (
            /* Verification view */
            <View style={styles.form}>
              <View style={styles.verifyCard}>
                <Mail size={ICON.lg} color={COLORS.primary} />
                <Text style={styles.verifyPrompt}>
                  We sent a 6-digit confirmation code to{' '}
                  <Text style={styles.bodyStrong}>{email.trim()}</Text>. Enter it below to activate
                  your account.
                </Text>
              </View>

              <TextField
                label="Verification Code"
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

              {error ? (
                <Text style={styles.errorText} accessibilityRole="alert">
                  {error}
                </Text>
              ) : null}

              <Button
                label="Verify & Complete Setup"
                onPress={handleVerify}
                loading={busy === 'verify'}
                disabled={!signUpLoaded || !!busy}
              />

              <Button
                label="Send a new code"
                variant="secondary"
                onPress={handleResend}
                loading={busy === 'resend'}
                disabled={!!busy}
              />

              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => setStage('form')}
                accessibilityRole="button"
              >
                <Text style={styles.linkText}>Edit registration details</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Registration form view */
            <View style={styles.form}>
              {/* Role Selection */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>Select Your Role</Text>
                <Text style={styles.sectionCaption}>Tailors your dashboard and features</Text>
              </View>

              <View style={styles.roleGrid}>
                {ROLE_OPTIONS.map((opt) => {
                  const selected = role === opt.value;
                  const Icon = opt.icon;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.roleCard, selected && styles.roleCardSelected]}
                      onPress={() => setRole(opt.value)}
                      activeOpacity={0.8}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                    >
                      <View style={styles.roleHeader}>
                        <View
                          style={[
                            styles.roleIconWrap,
                            selected && styles.roleIconWrapSelected,
                          ]}
                        >
                          <Icon
                            size={18}
                            color={selected ? COLORS.textInverse : COLORS.primary}
                          />
                        </View>
                        {selected ? (
                          <CheckCircle2 size={16} color={COLORS.primary} />
                        ) : null}
                      </View>
                      <Text
                        style={[
                          styles.roleLabel,
                          selected && styles.roleLabelSelected,
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <Text
                        style={[
                          styles.roleDesc,
                          selected && styles.roleDescSelected,
                        ]}
                        numberOfLines={2}
                      >
                        {opt.description}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Personal Details */}
              <TextField
                label="Full Name *"
                placeholder="e.g. Ramesh Chandra Sharma"
                icon={<User {...FIELD_ICON} />}
                value={fullName}
                onChangeText={(t) => {
                  setFullName(t);
                  setError('');
                }}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />

              <TextField
                ref={emailRef}
                label="Official / Personal Email *"
                placeholder="name@example.com"
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
                onSubmitEditing={() => phoneRef.current?.focus()}
              />

              <TextField
                ref={phoneRef}
                label="Mobile Number (Optional)"
                placeholder="10-digit mobile number"
                icon={<Phone {...FIELD_ICON} />}
                value={phone}
                onChangeText={(t) => {
                  setPhone(t.replace(/\D/g, '').slice(0, 10));
                  setError('');
                }}
                keyboardType="phone-pad"
                maxLength={10}
                returnKeyType="next"
                onSubmitEditing={() => orgRef.current?.focus()}
              />

              <TextField
                ref={orgRef}
                label={`${orgLabel} ${role !== 'trainee' ? '*' : ''}`}
                placeholder="e.g. VAMNICOM / Amul Dairy / District Union"
                icon={<Building2 {...FIELD_ICON} />}
                value={orgName}
                onChangeText={(t) => {
                  setOrgName(t);
                  setError('');
                }}
                returnKeyType="next"
                onSubmitEditing={() => pwRef.current?.focus()}
              />

              {/* State Picker Chips */}
              <View style={styles.group}>
                <Text style={styles.fieldLabel}>State / Union Territory</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.stateScroll}
                >
                  {POPULAR_STATES.map((s) => {
                    const isSelected = state === s;
                    return (
                      <TouchableOpacity
                        key={s}
                        style={[styles.stateChip, isSelected && styles.stateChipSelected]}
                        onPress={() => setState(s)}
                        accessibilityRole="button"
                      >
                        <MapPin
                          size={12}
                          color={isSelected ? COLORS.textInverse : COLORS.textSecondary}
                        />
                        <Text
                          style={[
                            styles.stateChipText,
                            isSelected && styles.stateChipTextSelected,
                          ]}
                        >
                          {s}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Password Fields */}
              <TextField
                ref={pwRef}
                label="Password *"
                placeholder="Minimum 15 characters"
                icon={<Lock {...FIELD_ICON} />}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setError('');
                }}
                secureTextEntry={!showPw}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
                hint={`Must be at least ${MIN_PASSWORD} characters.`}
                returnKeyType="next"
                onSubmitEditing={() => confirmPwRef.current?.focus()}
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

              <TextField
                ref={confirmPwRef}
                label="Confirm Password *"
                placeholder="Re-enter password"
                icon={<Lock {...FIELD_ICON} />}
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  setError('');
                }}
                secureTextEntry={!showPw}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />

              {error ? (
                <Text style={styles.errorText} accessibilityRole="alert">
                  {error}
                </Text>
              ) : null}

              <Button
                label="Create Account"
                onPress={handleRegister}
                loading={busy === 'register'}
                disabled={!signUpLoaded || !!busy}
              />

              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => navigation.navigate('Login')}
                accessibilityRole="button"
              >
                <Text style={styles.linkText}>
                  Already registered? <Text style={styles.linkTextBold}>Sign in here</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {
    padding: SPACE.lg,
    gap: SPACE.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.md,
  },
  backButton: {
    width: HIT,
    height: HIT,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
    gap: SPACE.xs,
  },
  title: { ...TEXT.title },
  subtitle: { ...TEXT.body, color: COLORS.textSecondary },
  form: { gap: SPACE.md },
  sectionHeader: { gap: SPACE.xs, marginTop: SPACE.xs },
  sectionLabel: { ...TEXT.section },
  sectionCaption: { ...TEXT.caption, color: COLORS.textMuted },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.sm,
  },
  roleCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    padding: SPACE.md,
    gap: SPACE.xs,
  },
  roleCardSelected: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primary,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACE.xs,
  },
  roleIconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconWrapSelected: {
    backgroundColor: COLORS.primary,
  },
  roleLabel: {
    ...TEXT.captionStrong,
    color: COLORS.primaryDark,
  },
  roleLabelSelected: {
    color: COLORS.primary,
  },
  roleDesc: {
    ...TEXT.caption,
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 14,
  },
  roleDescSelected: {
    color: COLORS.textSecondary,
  },
  group: { gap: SPACE.xs },
  fieldLabel: { ...TEXT.captionStrong },
  stateScroll: { gap: SPACE.xs, paddingVertical: SPACE.xs },
  stateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs + 2,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stateChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stateChipText: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
  },
  stateChipTextSelected: {
    color: COLORS.textInverse,
  },
  verifyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    backgroundColor: COLORS.primarySurface,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    borderRadius: RADII.md,
    padding: SPACE.md,
  },
  verifyPrompt: {
    flex: 1,
    ...TEXT.body,
    color: COLORS.textPrimary,
  },
  bodyStrong: { ...TEXT.bodyStrong },
  errorText: { ...TEXT.caption, color: COLORS.danger },
  linkBtn: { minHeight: HIT, alignItems: 'center', justifyContent: 'center' },
  linkText: { ...TEXT.body, color: COLORS.textSecondary },
  linkTextBold: { ...TEXT.bodyStrong, color: COLORS.primary },
});
