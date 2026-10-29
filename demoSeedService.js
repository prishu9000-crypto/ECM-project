/**
 * Development and Demo Seed Data for Event Cloud Manager.
 * Complies with Section 26: Academic sample data with fictional records.
 */

export const DEMO_USERS = {
  admin: {
    uid: 'demo_admin_01',
    fullName: 'Dr. Rajesh Sharma',
    email: 'admin@apex.edu.in',
    role: 'admin',
    department: 'Computer Science & Engineering',
    accountStatus: 'active'
  },
  coordinator: {
    uid: 'demo_coord_01',
    fullName: 'Prof. Ananya Iyer',
    email: 'ananya.iyer@apex.edu.in',
    role: 'coordinator',
    department: 'Information Technology',
    accountStatus: 'active'
  },
  student: {
    uid: 'demo_student_01',
    fullName: 'Aditya Verma',
    email: 'aditya.21cs@apex.edu.in',
    role: 'student',
    rollNumber: '21CS042',
    department: 'Computer Science & Engineering',
    academicYear: 'Final Year (4th)',
    section: 'A',
    accountStatus: 'active'
  }
};

export const DEFAULT_ADMINS = [
  {
    uid: 'demo_admin_01',
    fullName: 'Dr. Rajesh Sharma',
    email: 'admin@apex.edu.in',
    role: 'admin',
    department: 'Computer Science & Engineering',
    accountStatus: 'active',
    createdAt: new Date(Date.now() - 30 * 86400 * 1000).toISOString()
  },
  {
    uid: 'demo_admin_02',
    fullName: 'Dr. Meenakshi Sundaram',
    email: 'meenakshi.s@apex.edu.in',
    role: 'admin',
    department: 'Dean of Student Affairs',
    accountStatus: 'active',
    createdAt: new Date(Date.now() - 20 * 86400 * 1000).toISOString()
  }
];

export const DEFAULT_COORDINATORS = [
  {
    uid: 'demo_coord_01',
    fullName: 'Prof. Ananya Iyer',
    email: 'ananya.iyer@apex.edu.in',
    role: 'coordinator',
    department: 'Information Technology',
    assignedEventsCount: 3,
    accountStatus: 'active',
    createdAt: new Date(Date.now() - 15 * 86400 * 1000).toISOString()
  },
  {
    uid: 'coord_02',
    fullName: 'Dr. Vikram Malhotra',
    email: 'vikram.malhotra@apex.edu.in',
    role: 'coordinator',
    department: 'Computer Science & Engineering',
    assignedEventsCount: 2,
    accountStatus: 'active',
    createdAt: new Date(Date.now() - 10 * 86400 * 1000).toISOString()
  },
  {
    uid: 'coord_03',
    fullName: 'Prof. Sandeep Rathi',
    email: 'sandeep.rathi@apex.edu.in',
    role: 'coordinator',
    department: 'Mechanical Engineering',
    assignedEventsCount: 1,
    accountStatus: 'active',
    createdAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString()
  }
];

export const DEFAULT_STUDENTS = [
  {
    uid: 'demo_student_01',
    fullName: 'Aditya Verma',
    rollNumber: '21CS042',
    email: 'aditya.21cs@apex.edu.in',
    department: 'Computer Science & Engineering',
    academicYear: 'Final Year (4th)',
    section: 'A',
    accountStatus: 'active',
    registeredEventsCount: 4,
    attendedEventsCount: 2,
    totalVerifiedHours: '9.50',
    createdAt: new Date(Date.now() - 25 * 86400 * 1000).toISOString()
  },
  {
    uid: 'stu_02',
    fullName: 'Sneha Patel',
    rollNumber: '22IT018',
    email: 'sneha.22it@apex.edu.in',
    department: 'Information Technology',
    academicYear: 'Third Year (3rd)',
    section: 'B',
    accountStatus: 'active',
    registeredEventsCount: 3,
    attendedEventsCount: 3,
    totalVerifiedHours: '12.00',
    createdAt: new Date(Date.now() - 20 * 86400 * 1000).toISOString()
  },
  {
    uid: 'stu_03',
    fullName: 'Rohan Deshmukh',
    rollNumber: '23EC091',
    email: 'rohan.23ec@apex.edu.in',
    department: 'Electronics & Communication',
    academicYear: 'Second Year (2nd)',
    section: 'A',
    accountStatus: 'active',
    registeredEventsCount: 2,
    attendedEventsCount: 1,
    totalVerifiedHours: '4.50',
    createdAt: new Date(Date.now() - 15 * 86400 * 1000).toISOString()
  },
  {
    uid: 'stu_04',
    fullName: 'Pooja Sundaram',
    rollNumber: '21CS088',
    email: 'pooja.21cs@apex.edu.in',
    department: 'Computer Science & Engineering',
    academicYear: 'Final Year (4th)',
    section: 'B',
    accountStatus: 'active',
    registeredEventsCount: 5,
    attendedEventsCount: 4,
    totalVerifiedHours: '18.50',
    createdAt: new Date(Date.now() - 12 * 86400 * 1000).toISOString()
  }
];

export const DEMO_EVENTS = [
  {
    eventId: 'evt_tech_01',
    title: 'Cloud Native DevOps & Kubernetes Workshop',
    description: 'Hands-on intensive masterclass on containerization with Docker, Kubernetes orchestration, and GitOps CI/CD pipelines on Google Cloud Platform.',
    category: 'Technical Workshop',
    venue: 'APJ Abdul Kalam Seminar Hall & Lab 3',
    startAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    endAt: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
    registrationDeadline: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    maxParticipants: 120,
    registeredCount: 85,
    status: 'ongoing',
    coordinatorUids: ['demo_coord_01'],
    attendancePolicy: {
      requireCheckout: true,
      minAttendancePercent: 75,
      allowLateCheckin: true
    },
    createdBy: 'demo_admin_01',
    createdAt: new Date(Date.now() - 7 * 86400 * 1000).toISOString()
  },
  {
    eventId: 'evt_hack_02',
    title: 'HackNova 24-Hour AI & Web3 Hackathon',
    description: 'Annual college hackathon inviting student innovators to develop AI agents, decentralized applications, and smart campus solutions.',
    category: 'Hackathon',
    venue: 'Main Auditorium & Innovation Center',
    startAt: new Date(Date.now() + 2 * 86400 * 1000).toISOString(),
    endAt: new Date(Date.now() + 3 * 86400 * 1000).toISOString(),
    registrationDeadline: new Date(Date.now() + 1 * 86400 * 1000).toISOString(),
    maxParticipants: 200,
    registeredCount: 164,
    status: 'published',
    coordinatorUids: ['demo_coord_01'],
    attendancePolicy: {
      requireCheckout: true,
      minAttendancePercent: 80,
      allowLateCheckin: false
    },
    createdBy: 'demo_admin_01',
    createdAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString()
  },
  {
    eventId: 'evt_fest_03',
    title: 'Tarang Annual Inter-College Cultural Fest',
    description: 'A vibrant celebration of music, theater, classical dance, literary arts, and fashion showcasing university talents.',
    category: 'College Cultural Fest',
    venue: 'Open Air Amphitheatre',
    startAt: new Date(Date.now() + 5 * 86400 * 1000).toISOString(),
    endAt: new Date(Date.now() + 6 * 86400 * 1000).toISOString(),
    registrationDeadline: new Date(Date.now() + 4 * 86400 * 1000).toISOString(),
    maxParticipants: 500,
    registeredCount: 380,
    status: 'published',
    coordinatorUids: ['demo_coord_01'],
    attendancePolicy: {
      requireCheckout: false,
      minAttendancePercent: 50,
      allowLateCheckin: true
    },
    createdBy: 'demo_admin_01',
    createdAt: new Date(Date.now() - 10 * 86400 * 1000).toISOString()
  },
  {
    eventId: 'evt_nss_04',
    title: 'NSS Community Service: Green Earth Plantation Drive',
    description: 'National Service Scheme environmental action day planting 1,000 native trees across the campus perimeter and surrounding villages.',
    category: 'NSS Community Service',
    venue: 'North Campus Grounds & Eco Park',
    startAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    endAt: new Date(Date.now() - 42 * 3600 * 1000).toISOString(),
    registrationDeadline: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    maxParticipants: 100,
    registeredCount: 92,
    status: 'completed',
    coordinatorUids: ['demo_coord_01'],
    attendancePolicy: {
      requireCheckout: true,
      minAttendancePercent: 80,
      allowLateCheckin: true
    },
    createdBy: 'demo_admin_01',
    createdAt: new Date(Date.now() - 14 * 86400 * 1000).toISOString()
  },
  {
    eventId: 'evt_career_05',
    title: 'Higher Studies & Tech Career Guidance 2026',
    description: 'Alumni panel featuring industry software architects and overseas postgraduate scholars sharing GRE/GATE strategies and mock interview insights.',
    category: 'Career Guidance Seminar',
    venue: 'Vikram Sarabhai Conference Hall',
    startAt: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    endAt: new Date(Date.now() - 92 * 3600 * 1000).toISOString(),
    registrationDeadline: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
    maxParticipants: 150,
    registeredCount: 140,
    status: 'completed',
    coordinatorUids: ['demo_coord_01'],
    attendancePolicy: {
      requireCheckout: true,
      minAttendancePercent: 75,
      allowLateCheckin: true
    },
    createdBy: 'demo_admin_01',
    createdAt: new Date(Date.now() - 20 * 86400 * 1000).toISOString()
  }
];

export const DEMO_ATTENDANCE_RECORDS = [
  {
    recordId: 'att_01',
    eventId: 'evt_nss_04',
    eventTitle: 'NSS Community Service: Green Earth Plantation Drive',
    attendanceSessionId: 'sess_nss_01',
    studentUid: 'demo_student_01',
    studentName: 'Aditya Verma',
    studentEmail: 'aditya.21cs@apex.edu.in',
    rollNumber: '21CS042',
    department: 'Computer Science & Engineering',
    checkInAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    checkOutAt: new Date(Date.now() - 42 * 3600 * 1000 - 1800 * 1000).toISOString(),
    verifiedDurationSeconds: 19800,
    verifiedHours: '5.50',
    attendancePercentage: 91.67,
    status: 'checked-out'
  },
  {
    recordId: 'att_02',
    eventId: 'evt_career_05',
    eventTitle: 'Higher Studies & Tech Career Guidance 2026',
    attendanceSessionId: 'sess_career_01',
    studentUid: 'demo_student_01',
    studentName: 'Aditya Verma',
    studentEmail: 'aditya.21cs@apex.edu.in',
    rollNumber: '21CS042',
    department: 'Computer Science & Engineering',
    checkInAt: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    checkOutAt: new Date(Date.now() - 92 * 3600 * 1000).toISOString(),
    verifiedDurationSeconds: 14400,
    verifiedHours: '4.00',
    attendancePercentage: 100.00,
    status: 'checked-out'
  },
  {
    recordId: 'att_03',
    eventId: 'evt_tech_01',
    eventTitle: 'Cloud Native DevOps & Kubernetes Workshop',
    attendanceSessionId: 'sess_tech_live_01',
    studentUid: 'demo_student_01',
    studentName: 'Aditya Verma',
    studentEmail: 'aditya.21cs@apex.edu.in',
    rollNumber: '21CS042',
    department: 'Computer Science & Engineering',
    checkInAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    checkOutAt: null,
    verifiedDurationSeconds: 7200,
    verifiedHours: '2.00',
    attendancePercentage: 33.33,
    status: 'checked-in'
  }
];

export const DEMO_REGISTRATIONS = [
  {
    registrationId: 'reg_01',
    eventId: 'evt_tech_01',
    studentUid: 'demo_student_01',
    registrationStatus: 'confirmed',
    registeredAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString()
  },
  {
    registrationId: 'reg_02',
    eventId: 'evt_hack_02',
    studentUid: 'demo_student_01',
    registrationStatus: 'confirmed',
    registeredAt: new Date(Date.now() - 1 * 86400 * 1000).toISOString()
  },
  {
    registrationId: 'reg_03',
    eventId: 'evt_nss_04',
    studentUid: 'demo_student_01',
    registrationStatus: 'confirmed',
    registeredAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString()
  },
  {
    registrationId: 'reg_04',
    eventId: 'evt_career_05',
    studentUid: 'demo_student_01',
    registrationStatus: 'confirmed',
    registeredAt: new Date(Date.now() - 6 * 86400 * 1000).toISOString()
  }
];

export const DEMO_AUDIT_LOGS = [
  {
    logId: 'log_01',
    actorUid: 'demo_admin_01',
    action: 'EVENT_CREATED',
    resourceType: 'event',
    resourceId: 'evt_hack_02',
    outcome: 'SUCCESS',
    timestamp: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
    metadata: { title: 'HackNova 24-Hour AI & Web3 Hackathon' }
  },
  {
    logId: 'log_02',
    actorUid: 'demo_admin_01',
    action: 'COORDINATOR_ASSIGNED',
    resourceType: 'event',
    resourceId: 'evt_tech_01',
    outcome: 'SUCCESS',
    timestamp: new Date(Date.now() - 4 * 86400 * 1000).toISOString(),
    metadata: { coordinator: 'Prof. Ananya Iyer' }
  },
  {
    logId: 'log_03',
    actorUid: 'demo_coord_01',
    action: 'ATTENDANCE_SESSION_STARTED',
    resourceType: 'attendanceSession',
    resourceId: 'sess_tech_live_01',
    outcome: 'SUCCESS',
    timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    metadata: { eventId: 'evt_tech_01' }
  },
  {
    logId: 'log_04',
    actorUid: 'demo_student_01',
    action: 'STUDENT_CHECK_IN',
    resourceType: 'attendanceRecord',
    resourceId: 'att_03',
    outcome: 'SUCCESS',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    metadata: { eventId: 'evt_tech_01' }
  }
];
