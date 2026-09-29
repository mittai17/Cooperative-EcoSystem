export interface TimetableSlotData {
  id: string;
  day: string;
  time: string;
  title: string;
  room: string;
  trainer: string;
  batch_id?: string;
  batch_name?: string;
  status: 'scheduled' | 'rescheduled' | 'cancelled';
  rescheduled_date?: string;
  rescheduled_time?: string;
  rescheduled_room?: string;
  rescheduled_reason?: string;
}

export interface HostelAllocationData {
  status: 'allocated' | 'waitlisted' | 'in_review';
  block_name: string;
  room_number: string;
  room_type: 'Single' | 'Double Sharing' | 'Triple Sharing';
  floor: string;
  bed_label: string;
  check_in_date: string;
  check_out_date: string;
  warden_name: string;
  warden_phone: string;
  warden_office: string;
  gate_curfew: string;
  mess_timings: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
  amenities: string[];
  rules: string[];
  waitlist_position?: number;
  estimated_clearance_days?: number;
}

export interface HostelWaitlistRecord {
  id: string;
  trainee_id: string;
  name: string;
  programme: string;
  applied_on: string;
  preference: 'Single' | 'Double Sharing' | 'Triple Sharing';
  dietary: 'Vegetarian' | 'Non-Vegetarian' | 'Jain';
  special_notes?: string;
  status: 'pending' | 'allocated' | 'rejected';
  queue_position: number;
}

export interface LogisticsChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'kit' | 'id_card' | 'wifi' | 'library' | 'mess' | 'biometric' | 'hostel';
  completed: boolean;
  desk_location: string;
  counter_hours: string;
  officer_in_charge: string;
}

export interface NotificationInboxItem {
  id: string;
  category: 'urgent' | 'academic' | 'campus' | 'logistics';
  title: string;
  body: string;
  created_at: string;
  read: boolean;
  priority: 'high' | 'normal' | 'low';
  action_label?: string;
  action_screen?: 'NominationDetail' | 'HostelWaitlist' | 'ScheduleChange' | 'LogisticsChecklist' | 'CourseDetail';
  action_params?: Record<string, string>;
}

export const MOCK_TIMETABLE_SLOTS: TimetableSlotData[] = [
  {
    id: 'slot-101',
    day: 'Monday',
    time: '09:00 - 10:30 AM',
    title: 'Cooperative Principles, By-Laws & Legal Framework',
    room: 'Lecture Hall 2 (Main Academic Block)',
    trainer: 'Dr. Rameshwar K. Joshi',
    batch_name: 'Batch 1 - Oct 2026',
    status: 'scheduled',
  },
  {
    id: 'slot-102',
    day: 'Monday',
    time: '11:00 AM - 12:30 PM',
    title: 'Financial Management, Double-Entry & Audit Procedures',
    room: 'Lecture Hall 2 (Main Academic Block)',
    trainer: 'Prof. Ananth Patil',
    batch_name: 'Batch 1 - Oct 2026',
    status: 'scheduled',
  },
  {
    id: 'slot-103',
    day: 'Monday',
    time: '02:00 - 03:30 PM',
    title: 'PACS Computerisation & Cloud ERP Architecture Lab',
    room: 'Computer Lab 1 (Terminal Block)',
    trainer: 'Er. Meenakshi Sundaram',
    batch_name: 'Batch 1 - Oct 2026',
    status: 'rescheduled',
    rescheduled_date: '2026-10-19',
    rescheduled_time: '04:00 - 05:30 PM',
    rescheduled_room: 'Computer Lab 2',
    rescheduled_reason: 'Server upgrade in Terminal Lab 1',
  },
  {
    id: 'slot-104',
    day: 'Tuesday',
    time: '09:00 - 10:30 AM',
    title: 'Statutory Audit Norms & NABARD Inspection Guidelines',
    room: 'Seminar Room A',
    trainer: 'Shri Vinod Deshmukh',
    batch_name: 'Batch 1 - Oct 2026',
    status: 'scheduled',
  },
  {
    id: 'slot-105',
    day: 'Tuesday',
    time: '11:00 AM - 12:30 PM',
    title: 'Agricultural Credit Scoring & KCC Recovery Framework',
    room: 'Lecture Hall 1',
    trainer: 'Prof. Ananth Patil',
    batch_name: 'Batch 1 - Oct 2026',
    status: 'scheduled',
  },
  {
    id: 'slot-106',
    day: 'Wednesday',
    time: '10:00 - 11:30 AM',
    title: 'Dairy Cold Chain Route Scheduling & Bulk Milk Chilling',
    room: 'Dairy Technology Wing',
    trainer: 'Dr. Ketan Barot',
    batch_name: 'Batch 1 - Oct 2026',
    status: 'scheduled',
  },
];

export const MOCK_TRAINEE_HOSTEL: HostelAllocationData = {
  status: 'allocated',
  block_name: 'Sardar Vallabhbhai Patel Bhavan (Block B)',
  room_number: 'Room B-204',
  room_type: 'Double Sharing',
  floor: '2nd Floor (West Wing)',
  bed_label: 'Bed B-1 (Window Side)',
  check_in_date: '2026-10-14',
  check_out_date: '2026-11-13',
  warden_name: 'Shri Ravindra K. Sharma (Senior Warden)',
  warden_phone: '+91 98223 99812',
  warden_office: 'Block B Ground Floor, Office Room 04',
  gate_curfew: '10:00 PM (Strict Biometric Punch)',
  mess_timings: {
    breakfast: '07:30 AM - 09:00 AM',
    lunch: '12:45 PM - 02:00 PM',
    dinner: '07:30 PM - 09:15 PM',
  },
  amenities: [
    'High-Speed Wi-Fi (SSID: VAMNICOM-Hostel-B)',
    'Individual Study Desk & Ergonomic Chair',
    'Attached Bathroom with Solar Hot Water (6-9 AM)',
    'Air Cooler & Ceiling Fan',
    'Steel Wardrobe with Digital Locker Provision',
  ],
  rules: [
    'Smoking, consumption of alcohol, or unauthorized electric heaters strictly prohibited.',
    'Visitors allowed only in common lounge between 5:00 PM and 7:00 PM.',
    'Night pass required from Warden for off-campus overnight stays.',
  ],
};

export const MOCK_HOSTEL_WAITLIST: HostelWaitlistRecord[] = [
  {
    id: 'wait-01',
    trainee_id: 'usr-t-10',
    name: 'Santosh Kumar Shinde',
    programme: 'Cooperative Management & Governance Excellence',
    applied_on: '2026-09-15',
    preference: 'Double Sharing',
    dietary: 'Vegetarian',
    status: 'allocated',
    queue_position: 1,
  },
  {
    id: 'wait-02',
    trainee_id: 'usr-t-11',
    name: 'Prakash Narayan Kulkarni',
    programme: 'PACS Computerisation & Statutory Compliance',
    applied_on: '2026-09-20',
    preference: 'Double Sharing',
    dietary: 'Vegetarian',
    special_notes: 'Ground floor requested due to knee ligament injury.',
    status: 'pending',
    queue_position: 2,
  },
  {
    id: 'wait-03',
    trainee_id: 'usr-t-12',
    name: 'Meena Ramesh Gaikwad',
    programme: 'Dairy Cooperative Enterprise & Cold Chain',
    applied_on: '2026-09-22',
    preference: 'Single',
    dietary: 'Jain',
    status: 'pending',
    queue_position: 3,
  },
  {
    id: 'wait-04',
    trainee_id: 'usr-t-13',
    name: 'Dharmendra Yadav',
    programme: 'Cooperative Management & Governance Excellence',
    applied_on: '2026-09-24',
    preference: 'Triple Sharing',
    dietary: 'Non-Vegetarian',
    status: 'pending',
    queue_position: 4,
  },
];

export const MOCK_LOGISTICS_CHECKLIST: LogisticsChecklistItem[] = [
  {
    id: 'log-1',
    title: 'Welcome Kit & Academic Bag',
    description: 'Course binder, cooperative statutory compendium, notepad, executive pen & water bottle.',
    category: 'kit',
    completed: true,
    desk_location: 'Main Auditorium Foyer Counter 1',
    counter_hours: '08:30 AM - 05:30 PM',
    officer_in_charge: 'Smt. Archana Jadhav',
  },
  {
    id: 'log-2',
    title: 'Smart RFID Trainee ID Card',
    description: 'Photo-printed smart identity card enabled for campus gate, library and lab access.',
    category: 'id_card',
    completed: true,
    desk_location: 'IT & Security Cell (Admin Block Room 12)',
    counter_hours: '09:00 AM - 06:00 PM',
    officer_in_charge: 'Shri Nitin Shinde',
  },
  {
    id: 'log-3',
    title: 'Campus Wi-Fi Credentials',
    description: 'Active 802.1X secure credentials for laptops and mobile devices (SSID: CoopSetu-Secure).',
    category: 'wifi',
    completed: true,
    desk_location: 'Computer Center Helpdesk Counter B',
    counter_hours: '24x7 Automated Self-Portal',
    officer_in_charge: 'Er. Alok Verma',
  },
  {
    id: 'log-4',
    title: 'Digital Library & E-Resource Access',
    description: 'National Cooperative Library card and login credentials to e-repository databases.',
    category: 'library',
    completed: false,
    desk_location: 'Vaikunth Mehta Central Library Helpdesk',
    counter_hours: '08:00 AM - 08:00 PM',
    officer_in_charge: 'Dr. S. K. Mahajan (Librarian)',
  },
  {
    id: 'log-5',
    title: 'Dining Hall / Mess Smart Card',
    description: 'Preloaded biometric meal subscription card for breakfast, lunch, high tea, and dinner.',
    category: 'mess',
    completed: true,
    desk_location: 'Annapurna Dining Hall Reception',
    counter_hours: 'Meal Hours Only',
    officer_in_charge: 'Shri Manohar Rane (Mess Steward)',
  },
  {
    id: 'log-6',
    title: 'Biometric / Face Attendance Enrolment',
    description: 'Registration of trainee facial vector for automated touchless attendance in lecture halls.',
    category: 'biometric',
    completed: false,
    desk_location: 'Room 104, Academic Annex',
    counter_hours: '09:30 AM - 05:00 PM',
    officer_in_charge: 'Technical Support Cell',
  },
  {
    id: 'log-7',
    title: 'Hostel Room Keys & Linen Handover',
    description: 'Room B-204 key set, clean bed linen, and hostel inventory acknowledgement form.',
    category: 'hostel',
    completed: true,
    desk_location: 'Block B Warden Office',
    counter_hours: '07:00 AM - 10:00 PM',
    officer_in_charge: 'Shri Ravindra K. Sharma (Warden)',
  },
];

export const MOCK_NOTIFICATIONS: NotificationInboxItem[] = [
  {
    id: 'notif-01',
    category: 'urgent',
    title: 'Timetable Change: ERP Lab Rescheduled',
    body: 'The Monday afternoon PACS Computerisation lab session has been shifted to 04:00 PM in Computer Lab 2 due to server maintenance.',
    created_at: '2026-09-28T14:10:00Z',
    read: false,
    priority: 'high',
    action_label: 'View Reschedule Notice',
    action_screen: 'ScheduleChange',
    action_params: { slotId: 'slot-103', date: '2026-10-19' },
  },
  {
    id: 'notif-02',
    category: 'campus',
    title: 'Hostel Room Allocated (Block B, Room 204)',
    body: 'Your accommodation request has been sanctioned. Please collect your room keys from the Block B Warden desk before 9:00 PM.',
    created_at: '2026-09-27T10:30:00Z',
    read: false,
    priority: 'normal',
    action_label: 'View Room Details',
    action_screen: 'HostelWaitlist',
  },
  {
    id: 'notif-03',
    category: 'academic',
    title: 'Nomination Approved by VAMNICOM',
    body: 'Congratulations! Your nomination for "Cooperative Management & Governance Excellence" has been accepted for Batch 1 starting Oct 15.',
    created_at: '2026-09-26T16:00:00Z',
    read: true,
    priority: 'normal',
    action_label: 'View Nomination Slip',
    action_screen: 'NominationDetail',
    action_params: { nominationId: 'nom-9821' },
  },
  {
    id: 'notif-04',
    category: 'logistics',
    title: 'Complete Onboarding Checklist (2 Pending)',
    body: 'Please visit the Central Library and Academic Annex to complete your biometric enrollment and digital library card issuance.',
    created_at: '2026-09-25T11:20:00Z',
    read: true,
    priority: 'normal',
    action_label: 'View Checklist',
    action_screen: 'LogisticsChecklist',
  },
  {
    id: 'notif-05',
    category: 'campus',
    title: 'Special Guest Lecture by NABARD Chief General Manager',
    body: 'Join us on Wednesday at 10:00 AM in the Main Auditorium for an interactive keynote on "Future of Cooperative Credit in Rural India".',
    created_at: '2026-09-24T09:00:00Z',
    read: true,
    priority: 'normal',
  },
];
