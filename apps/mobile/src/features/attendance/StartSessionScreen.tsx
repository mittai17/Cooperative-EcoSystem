import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, CARD, HIT, ICON, RADII, SPACE, TEXT } from '../../constants/theme';
import { ScrollScreen } from '../../components/ScrollScreen';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { attendanceApi } from './attendanceApi';
import {
  Play,
  Clock,
  Building,
  QrCode,
  Radio,
  ScanFace,
  CheckSquare,
  Square,
  ShieldCheck,
  BookOpen,
} from 'lucide-react-native';

export const StartSessionScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'StartSession'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const slotId = route.params?.slotId;

  const [sessionName, setSessionName] = useState('PACS Accounting & Statutory Compliance');
  const [selectedProgramme, setSelectedProgramme] = useState('Diploma in Cooperative Management');
  const [selectedBatch, setSelectedBatch] = useState('Cohort 2026-A');
  const [room, setRoom] = useState('Lecture Hall 2 · NCCT Pune');
  const [duration, setDuration] = useState<number>(30);
  const [rotatingQr, setRotatingQr] = useState<boolean>(true);

  const [allowQr, setAllowQr] = useState(true);
  const [allowNfc, setAllowNfc] = useState(true);
  const [allowFace, setAllowFace] = useState(true);

  const [launching, setLaunching] = useState(false);

  const handleLaunch = async () => {
    if (!sessionName.trim()) {
      Alert.alert('Session Name Required', 'Please enter a title for this attendance session.');
      return;
    }

    const methods: string[] = [];
    if (allowQr) methods.push('qr');
    if (allowNfc) methods.push('nfc');
    if (allowFace) methods.push('face');

    if (methods.length === 0) {
      Alert.alert('No Check-In Methods', 'Please enable at least one attendance verification method.');
      return;
    }

    setLaunching(true);
    try {
      const res = await attendanceApi.createSession({
        session_name: sessionName.trim(),
        duration_minutes: duration,
        room: room.trim(),
        allowed_methods: methods,
        is_rotating: rotatingQr,
      });

      setLaunching(false);
      navigation.replace('SessionConsole', { sessionId: res.session_id });
    } catch {
      setLaunching(false);
      Alert.alert('Launch Failed', 'Could not start attendance session. Please check your connection.');
    }
  };

  return (
    <ScrollScreen
      title="Start Session"
      subtitle="Trainer Attendance Console"
      onBack={() => navigation.goBack()}
    >
      <View style={styles.container}>
        {/* Session Name & Course Group */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Session Details</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Session Name:</Text>
            <TextInput
              style={styles.textInput}
              value={sessionName}
              onChangeText={setSessionName}
              placeholder="e.g. PACS Statutory Audit"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Programme / Curriculum:</Text>
            <View style={styles.staticField}>
              <BookOpen size={ICON.sm} color={COLORS.textSecondary} />
              <Text style={styles.staticFieldText}>{selectedProgramme}</Text>
            </View>
          </View>

          <View style={styles.rowFields}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Batch / Cohort:</Text>
              <View style={styles.staticField}>
                <Text style={styles.staticFieldText}>{selectedBatch}</Text>
              </View>
            </View>

            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Room / Venue:</Text>
              <TextInput
                style={styles.textInput}
                value={room}
                onChangeText={setRoom}
                placeholder="Hall 2"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>
        </View>

        {/* Duration Selector */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Attendance Window Duration</Text>
          <Text style={styles.sectionSub}>How long check-in remains open for enrolled students:</Text>

          <View style={styles.durationPillsRow}>
            {[15, 30, 45, 60, 90].map((mins) => (
              <TouchableOpacity
                key={mins}
                style={[styles.durationPill, duration === mins && styles.durationPillActive]}
                onPress={() => setDuration(mins)}
              >
                <Clock size={ICON.sm} color={duration === mins ? COLORS.primary : COLORS.textMuted} />
                <Text style={[styles.durationText, duration === mins && styles.durationTextActive]}>
                  {mins} mins
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Verification Methods & Anti-Proxy Options */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Verification Methods</Text>

          {/* Dynamic Rotating QR Toggle */}
          <View style={styles.switchRow}>
            <View style={styles.switchTextCol}>
              <View style={styles.switchTitleRow}>
                <ShieldCheck size={ICON.md} color={COLORS.primary} />
                <Text style={styles.switchTitle}>Dynamic Rotating QR (Anti-Proxy)</Text>
              </View>
              <Text style={styles.switchDesc}>
                Refreshes QR token every 15-30s to prevent photo sharing and proxy check-ins.
              </Text>
            </View>
            <Switch
              value={rotatingQr}
              onValueChange={setRotatingQr}
              trackColor={{ false: COLORS.border, true: COLORS.primarySurface }}
              thumbColor={rotatingQr ? COLORS.primary : COLORS.border}
            />
          </View>

          {/* Allowed Methods Checklist */}
          <View style={styles.methodsList}>
            <TouchableOpacity
              style={styles.methodCheckRow}
              onPress={() => setAllowQr((prev) => !prev)}
            >
              {allowQr ? (
                <CheckSquare size={ICON.md} color={COLORS.primary} />
              ) : (
                <Square size={ICON.md} color={COLORS.border} />
              )}
              <QrCode size={ICON.sm} color={COLORS.textSecondary} />
              <Text style={styles.methodCheckText}>QR Code Scanner (Dynamic Token)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.methodCheckRow}
              onPress={() => setAllowNfc((prev) => !prev)}
            >
              {allowNfc ? (
                <CheckSquare size={ICON.md} color={COLORS.primary} />
              ) : (
                <Square size={ICON.md} color={COLORS.border} />
              )}
              <Radio size={ICON.sm} color={COLORS.textSecondary} />
              <Text style={styles.methodCheckText}>NFC Contactless Terminal Tap</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.methodCheckRow}
              onPress={() => setAllowFace((prev) => !prev)}
            >
              {allowFace ? (
                <CheckSquare size={ICON.md} color={COLORS.primary} />
              ) : (
                <Square size={ICON.md} color={COLORS.border} />
              )}
              <ScanFace size={ICON.sm} color={COLORS.textSecondary} />
              <Text style={styles.methodCheckText}>Face Biometric Verification</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Launch Button */}
        <View style={styles.actionBox}>
          <Button
            label={launching ? 'Launching Live Session...' : 'Launch Attendance Session'}
            icon={<Play size={ICON.md} color={COLORS.textInverse} />}
            onPress={handleLaunch}
            loading={launching}
          />
        </View>
      </View>
    </ScrollScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACE.md,
    paddingBottom: SPACE.xl,
  },
  card: {
    ...CARD,
    padding: SPACE.md,
    gap: SPACE.md,
  },
  sectionHeading: {
    ...TEXT.bodyStrong,
    fontSize: 15,
  },
  sectionSub: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    marginTop: -SPACE.xs,
  },
  fieldGroup: {
    gap: 4,
  },
  fieldLabel: {
    ...TEXT.captionStrong,
    color: COLORS.primaryDark,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: SPACE.sm,
    height: HIT,
    ...TEXT.body,
    backgroundColor: COLORS.surface,
  },
  staticField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADII.md,
    paddingHorizontal: SPACE.sm,
    height: HIT,
    backgroundColor: COLORS.surface,
  },
  staticFieldText: {
    ...TEXT.body,
    color: COLORS.textSecondary,
  },
  rowFields: {
    flexDirection: 'row',
    gap: SPACE.sm,
  },
  durationPillsRow: {
    flexDirection: 'row',
    gap: SPACE.xs,
    flexWrap: 'wrap',
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  durationPillActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySurface,
  },
  durationText: {
    ...TEXT.captionStrong,
    color: COLORS.textSecondary,
  },
  durationTextActive: {
    color: COLORS.primary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACE.md,
    paddingVertical: SPACE.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: SPACE.sm,
  },
  switchTextCol: {
    flex: 1,
    gap: 2,
  },
  switchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  switchTitle: {
    ...TEXT.bodyStrong,
    fontSize: 13,
  },
  switchDesc: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 14,
  },
  methodsList: {
    gap: SPACE.sm,
  },
  methodCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingVertical: 2,
  },
  methodCheckText: {
    ...TEXT.body,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  actionBox: {
    marginTop: SPACE.xs,
  },
});
