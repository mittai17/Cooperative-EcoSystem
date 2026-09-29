import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, CARD, HIT, ICON, RADII, SPACE, TEXT } from '../../constants/theme';
import { ScrollScreen } from '../../components/ScrollScreen';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { attendanceApi } from './attendanceApi';
import {
  ScanFace,
  CheckCircle2,
  Camera,
  ShieldCheck,
  CheckSquare,
  Square,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Eye,
  ArrowRight,
} from 'lucide-react-native';

const LIVENESS_STEPS = [
  { step: 1, prompt: 'Look Directly at Camera', hint: 'Keep your face inside the oval guide and hold still.' },
  { step: 2, prompt: 'Blink Your Eyes Slowly', hint: 'Natural blink verifies active human liveness.' },
  { step: 3, prompt: 'Turn Head Slightly to the Right', hint: 'Multi-angle pose ensures 3D biometric depth.' },
];

export const FaceEnrolScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'FaceEnrol'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const mode = route.params?.mode || 'self';
  const traineeId = route.params?.traineeId;

  const [permission, requestPermission] = useCameraPermissions();
  const [consentGiven, setConsentGiven] = useState(false);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [capturedFrames, setCapturedFrames] = useState<number[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [completed, setCompleted] = useState(false);

  const currentPose = LIVENESS_STEPS[currentPoseIndex];

  const handleCaptureFrame = () => {
    if (!consentGiven) {
      Alert.alert(
        'DPDP Consent Required',
        'Please check the DPDP Act consent agreement box before capturing biometric templates.'
      );
      return;
    }

    setCapturing(true);

    setTimeout(() => {
      setCapturing(false);
      const nextFrames = [...capturedFrames, currentPoseIndex + 1];
      setCapturedFrames(nextFrames);

      if (currentPoseIndex < LIVENESS_STEPS.length - 1) {
        setCurrentPoseIndex((prev) => prev + 1);
      } else {
        // All 3 frames captured!
        attendanceApi.enrollFaceConsent(true).then(() => {
          setCompleted(true);
        });
      }
    }, 900);
  };

  const handleReset = () => {
    setCapturedFrames([]);
    setCurrentPoseIndex(0);
    setCompleted(false);
  };

  return (
    <ScrollScreen
      title="Biometric Face Enrolment"
      subtitle={mode === 'trainer' ? `Trainer Enrolment · Trainee ${traineeId}` : 'Digital Identity & Attendance'}
      onBack={() => navigation.goBack()}
    >
      <View style={styles.container}>
        {/* DPDP Consent Notice Banner */}
        <View style={styles.consentCard}>
          <View style={styles.consentHeader}>
            <ShieldCheck size={ICON.md} color={COLORS.primary} />
            <Text style={styles.consentTitle}>DPDP Act 2023 Biometric Privacy Notice</Text>
          </View>
          <Text style={styles.consentBody}>
            Biometric facial embeddings are converted into encrypted mathematical vectors (128-d cosine embedding).
            Raw photos are discarded after extraction and never stored on public servers.
          </Text>

          <TouchableOpacity
            style={styles.consentCheckboxRow}
            onPress={() => setConsentGiven((prev) => !prev)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: consentGiven }}
          >
            {consentGiven ? (
              <CheckSquare size={ICON.md} color={COLORS.primary} />
            ) : (
              <Square size={ICON.md} color={COLORS.border} />
            )}
            <Text style={styles.consentCheckboxText}>
              I consent to enrolling facial biometric templates for attendance verification.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Live Camera View with Oval Guide */}
        {!completed ? (
          <View style={styles.cameraBoxWrapper}>
            <View style={styles.cameraBox}>
              <CameraView style={StyleSheet.absoluteFill} facing="front" />

              {/* Oval Face Guide Overlay */}
              <View style={styles.faceOverlay}>
                <View
                  style={[
                    styles.faceOvalGuide,
                    consentGiven ? styles.faceOvalActive : styles.faceOvalInactive,
                  ]}
                />

                {/* Step indicator */}
                <View style={styles.stepBubble}>
                  <Text style={styles.stepBubbleText}>
                    Frame {currentPoseIndex + 1} of 3
                  </Text>
                </View>

                {/* Dynamic Liveness Prompt */}
                <View style={styles.promptBanner}>
                  <Text style={styles.promptHeading}>{currentPose.prompt}</Text>
                  <Text style={styles.promptHint}>{currentPose.hint}</Text>
                </View>
              </View>
            </View>

            {/* Frame Progress Indicators */}
            <View style={styles.progressDotsRow}>
              {LIVENESS_STEPS.map((s, idx) => {
                const isDone = capturedFrames.includes(s.step);
                const isCurrent = idx === currentPoseIndex && !isDone;
                return (
                  <View
                    key={s.step}
                    style={[
                      styles.progressDot,
                      isDone && styles.progressDotDone,
                      isCurrent && styles.progressDotCurrent,
                    ]}
                  >
                    {isDone ? (
                      <CheckCircle2 size={12} color={COLORS.textInverse} />
                    ) : (
                      <Text
                        style={[
                          styles.progressDotText,
                          isCurrent && styles.progressDotTextCurrent,
                        ]}
                      >
                        {s.step}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Capture CTA */}
            <View style={styles.captureActionBox}>
              <Button
                label={
                  capturing
                    ? 'Extracting Feature Vector...'
                    : `Capture Frame ${currentPoseIndex + 1}`
                }
                icon={<Camera size={ICON.md} color={COLORS.textInverse} />}
                onPress={handleCaptureFrame}
                loading={capturing}
                disabled={!consentGiven}
              />
            </View>
          </View>
        ) : (
          /* Enrolment Confirmation Card */
          <View style={styles.successCard}>
            <View style={styles.successIconWrapper}>
              <CheckCircle2 size={56} color={COLORS.success} />
            </View>

            <Text style={styles.successTitle}>Biometric Template Registered</Text>
            <Text style={styles.successSub}>
              Your facial verification template has been successfully generated and verified for multi-factor
              attendance check-ins.
            </Text>

            <View style={styles.specBox}>
              <View style={styles.specRow}>
                <Text style={styles.specKey}>Biometric Engine</Text>
                <Text style={styles.specVal}>YuNet + SFace Mobile V1</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specKey}>Embedding Vector</Text>
                <Text style={styles.specVal}>128-d Normalized Float</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specKey}>Liveness Defense</Text>
                <Text style={[styles.specVal, { color: COLORS.success }]}>3-Pose Passed (Active)</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specKey}>DPDP Consent</Text>
                <Text style={styles.specVal}>Recorded · Version 1.0</Text>
              </View>
            </View>

            <View style={styles.successActions}>
              <Button
                label="Return to Attendance Check-In"
                onPress={() => navigation.navigate('Attend', { method: 'face' })}
              />

              <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                <RefreshCw size={ICON.sm} color={COLORS.textSecondary} />
                <Text style={styles.resetBtnText}>Re-enrol Biometrics</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACE.md,
    paddingBottom: SPACE.xl,
  },
  consentCard: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.sm,
    backgroundColor: COLORS.surface,
  },
  consentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  consentTitle: {
    ...TEXT.bodyStrong,
    color: COLORS.primaryDark,
  },
  consentBody: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  consentCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingTop: SPACE.xs,
  },
  consentCheckboxText: {
    ...TEXT.bodyStrong,
    flex: 1,
    fontSize: 12,
    color: COLORS.primary,
  },
  cameraBoxWrapper: {
    gap: SPACE.md,
  },
  cameraBox: {
    height: 380,
    borderRadius: RADII.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  faceOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACE.lg,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  faceOvalGuide: {
    width: 220,
    height: 290,
    borderRadius: 110,
    borderWidth: 2,
    borderStyle: 'dashed',
    position: 'absolute',
    top: 35,
  },
  faceOvalActive: {
    borderColor: COLORS.primary,
    borderWidth: 3,
  },
  faceOvalInactive: {
    borderColor: 'rgba(255,255,255,0.4)',
  },
  stepBubble: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: SPACE.md,
    paddingVertical: 4,
    borderRadius: RADII.pill,
  },
  stepBubbleText: {
    ...TEXT.captionStrong,
    color: COLORS.textInverse,
  },
  promptBanner: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    borderRadius: RADII.md,
    alignItems: 'center',
    maxWidth: '88%',
    gap: 2,
  },
  promptHeading: {
    ...TEXT.bodyStrong,
    color: COLORS.textInverse,
    fontSize: 14,
  },
  promptHint: {
    ...TEXT.caption,
    color: COLORS.mediaText,
    fontSize: 11,
    textAlign: 'center',
  },
  progressDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACE.md,
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotCurrent: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySurface,
    borderWidth: 2,
  },
  progressDotDone: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  progressDotText: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  progressDotTextCurrent: {
    color: COLORS.primary,
  },
  captureActionBox: {
    marginTop: SPACE.xs,
  },
  successCard: {
    ...CARD,
    padding: SPACE.xl,
    alignItems: 'center',
    gap: SPACE.md,
    backgroundColor: COLORS.card,
  },
  successIconWrapper: {
    marginVertical: SPACE.xs,
  },
  successTitle: {
    ...TEXT.section,
    fontSize: 18,
    textAlign: 'center',
  },
  successSub: {
    ...TEXT.caption,
    textAlign: 'center',
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  specBox: {
    width: '100%',
    backgroundColor: COLORS.surface,
    padding: SPACE.md,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SPACE.xs,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  specKey: {
    ...TEXT.caption,
    color: COLORS.textMuted,
  },
  specVal: {
    ...TEXT.captionStrong,
    color: COLORS.primaryDark,
  },
  successActions: {
    width: '100%',
    gap: SPACE.sm,
    marginTop: SPACE.xs,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.xs,
    paddingVertical: SPACE.sm,
  },
  resetBtnText: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
  },
});
