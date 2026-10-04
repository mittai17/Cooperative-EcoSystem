# NURVEX - Mobile Application (Expo & React Native)

Production-grade cross-platform React Native / Expo application for **NURVEX**, the National Cooperative Skilling, Certification, and Career Placement ecosystem.

Designed following the **Maximum White UI style**, deep blue accents (`#1E3A8A`), high contrast badges, and offline-first edge resiliency.

---

## 📱 Implemented Screens & Workflows

1. **Trainee Dashboard (`src/screens/DashboardScreen.tsx`)**
   - Personalized greeting (`Namaste, Ravindra 👋`) & enrolled institution (`VAMNICOM Pune`).
   - Attendance percentage gauge (88% compliant, min 75%).
   - Verified Skill Strength metric (72%).
   - Continue Learning resume card with real-time curriculum progress bar.
   - Recommended cooperative vacancies from NCDC, Amul, MSC Bank, etc.
   - Quick navigation shortcuts: QR Attendance, Career AI, Offline Cache.

2. **Course Player (`src/screens/CoursePlayerScreen.tsx`)**
   - High-definition video player simulation with interactive Play/Pause controls and scrubber bar.
   - Module index and curriculum checklist.
   - "Mark as Complete" action and auto-advancing "Next Lesson" trigger.
   - Course handouts and offline study notes download button.

3. **QR Attendance Scanner (`src/screens/QRAttendanceScreen.tsx`)**
   - Camera viewfinder scanner simulation with alignment guides and laser beam animation.
   - One-tap "Simulate Camera QR Scan" button connected to `/api/v1/attendance/scan`.
   - Fallback manual 6-character token entry for remote PACS without functioning cameras.
   - Offline queue indicator with automatic local encrypted storage when disconnected.
   - Recent verified session logs.

4. **Career AI Advisor (`src/screens/CareerAIScreen.tsx`)**
   - Segmented dual-tab interface: **Advisor Chat** and **My Career Plan**.
   - Interactive LLM-powered cooperative mentor connected to `/api/v1/career/chat`.
   - One-tap query prompt chips (*"Which jobs match my skills?"*, *"How to become a CDO?"*).
   - Target Role readiness gauge (72% Readiness for CDO role).
   - Priority-ordered skill gap learning recommendations with impact metrics (+15% match).
   - Milestone career progression roadmap from Trainee to Senior Programme Manager.

5. **Job Matches & Placement (`src/screens/JobMatchesScreen.tsx`)**
   - Real-time matched vacancies from cooperative federations (Amul, NCDC, MSCB, etc.).
   - Match percentage badges (92%, 85%, 78%) based on Skill Passport verification.
   - Filter and search bar by title, employer, location, or skill.
   - One-Click "Apply with Skill Passport" action.

6. **Skill Passport (`src/screens/SkillPassportScreen.tsx`)**
   - 72% Overall Skill Strength gauge with tamper-evident NCCT / VAMNICOM endorsement.
   - Accordion breakdown of competencies (Cooperative Management, Governance, Data Analysis).
   - Verified vs. Self-assessed proficiency badges.
   - Expandable assessment evidence ledger displaying verifying institute and date.
   - Native Share sheet for sharing digital passport credentials.

7. **Offline Learning & Sync (`src/screens/OfflineLearningScreen.tsx`)**
   - Designed for low-connectivity rural PACS and remote panchayats.
   - Downloaded video lectures with file size indicators (184 MB, 240 MB).
   - Pending offline actions tracker (attendance check-ins and quiz responses).
   - One-tap **"Sync Now"** reconciliation button.
   - On-device storage cache usage bar.

8. **Certificates (`src/screens/CertificatesScreen.tsx`)**
   - Official credentials issued by IRMA, NCCT, and VAMNICOM.
   - Unique tamper-proof verification ID codes (e.g. `CST-2026-DAI-00842`).
   - Verified skills endorsements and PDF download action.

9. **Trainee Profile & Navigation (`src/screens/ProfileScreen.tsx`)**
   - Trainee credentials, government ID, enrolled academy, and email.
   - Quick navigation drawer links to all functional trainee workflows.

---

## 🛠️ Architecture & Tech Stack

- **Framework**: Expo SDK 57 (React Native 0.86, React 19)
- **Language**: TypeScript (strict mode enabled)
- **Navigation**: React Navigation v7 (Bottom Tabs + Native Stack)
- **Icons**: `lucide-react-native`
- **Backend API**: FastAPI deployed behind a public HTTPS origin configured with `EXPO_PUBLIC_API_BASE_URL`.
- **Offline Resiliency**: Unified API service with persisted cache and sync queue. Production builds never fall back to localhost or mock API data.

---

## 🚀 How to Run the Mobile App

### 1. Prerequisites
Ensure Node.js (>= 18) is installed.

### 2. Install Dependencies
```bash
cd apps/mobile
npm install
```

### 3. Verify TypeScript Types
```bash
npm run typecheck
```

### 4. Start the Expo Development Server
```bash
npx expo start
```

### 5. Running on Devices / Simulators
- Press `w` to open in your web browser.
- Press `a` to run on an attached Android device or emulator.
- Press `i` to run on an iOS simulator (macOS required).
- Scan the printed QR code using the **Expo Go** app on your physical iOS or Android phone.

---

## 🌐 Production configuration

Copy `.env.example` to `.env` for local builds and set the deployed backend origin:

```bash
EXPO_PUBLIC_API_BASE_URL=https://api.your-domain.com
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
```

The app appends `/api/v1` automatically. Release builds intentionally do not resolve
`localhost`, `127.0.0.1`, `10.0.2.2`, or the Metro host. If the cloud API URL is missing,
the app shows a configuration screen instead of producing a broken login experience.

Build an installable internal APK with:

```bash
npx eas build --profile preview --platform android
```
