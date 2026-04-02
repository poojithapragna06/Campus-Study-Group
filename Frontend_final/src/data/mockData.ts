import { User, StudyGroup, StudySession, Message, SharedFile } from '../types';

export const currentUser: User = {
  id: 'u1',
  name: 'Aryan Sharma',
  email: 'aryan.sharma@university.edu',
  avatar: 'AS',
  role: 'student',
  department: 'Computer Science',
  year: 3,
  joinedAt: '2024-08-01',
  groupsJoined: 4,
  sessionsAttended: 12,
};

export const adminUser: User = {
  id: 'a1',
  name: 'Dr. Priya Mehta',
  email: 'priya.mehta@university.edu',
  avatar: 'PM',
  role: 'admin',
  department: 'Administration',
  year: 0,
  joinedAt: '2022-01-15',
  groupsJoined: 0,
  sessionsAttended: 0,
};

export const users: User[] = [
  currentUser,
  { id: 'u2', name: 'Neha Patel', email: 'neha@uni.edu', avatar: 'NP', role: 'student', department: 'Mathematics', year: 2, joinedAt: '2024-08-01', groupsJoined: 3, sessionsAttended: 8 },
  { id: 'u3', name: 'Rohan Kumar', email: 'rohan@uni.edu', avatar: 'RK', role: 'student', department: 'Physics', year: 3, joinedAt: '2024-08-01', groupsJoined: 5, sessionsAttended: 15 },
  { id: 'u4', name: 'Priya Singh', email: 'priya.s@uni.edu', avatar: 'PS', role: 'student', department: 'Chemistry', year: 1, joinedAt: '2024-08-01', groupsJoined: 2, sessionsAttended: 4 },
  { id: 'u5', name: 'Amit Verma', email: 'amit@uni.edu', avatar: 'AV', role: 'student', department: 'Computer Science', year: 4, joinedAt: '2024-08-01', groupsJoined: 6, sessionsAttended: 20 },
  { id: 'u6', name: 'Sneha Das', email: 'sneha@uni.edu', avatar: 'SD', role: 'student', department: 'Biology', year: 2, joinedAt: '2024-08-01', groupsJoined: 3, sessionsAttended: 9 },
];

export const studyGroups: StudyGroup[] = [
  {
    id: 'g1',
    name: 'Algorithms & Data Structures',
    subject: 'Computer Science',
    description: 'Weekly sessions tackling LeetCode problems and exam prep for CS301.',
    members: [users[0], users[1], users[2], users[4]],
    maxMembers: 8,
    createdBy: 'u1',
    createdAt: '2024-09-01',
    tags: ['CS301', 'LeetCode', 'Algorithms'],
    isPrivate: false,
    status: 'active',
    coverColor: '#FFB800',
    nextSession: {
      id: 's1', groupId: 'g1', title: 'Dynamic Programming Deep Dive',
      date: '2026-04-02', time: '15:00', duration: 90, location: 'Library Room 2A',
      isOnline: false, attendees: ['u1', 'u2', 'u3'], maxAttendees: 8, description: 'Covering DP patterns'
    }
  },
  {
    id: 'g2',
    name: 'Calculus III Study Circle',
    subject: 'Mathematics',
    description: 'Multivariable calculus and vector analysis group. All levels welcome!',
    members: [users[1], users[3], users[5]],
    maxMembers: 6,
    createdBy: 'u2',
    createdAt: '2024-09-10',
    tags: ['Math301', 'Calculus', 'Vectors'],
    isPrivate: false,
    status: 'active',
    coverColor: '#00D4AA',
    nextSession: {
      id: 's2', groupId: 'g2', title: 'Line Integrals Review',
      date: '2026-04-03', time: '14:00', duration: 60, location: 'Zoom',
      isOnline: true, attendees: ['u2', 'u4'], maxAttendees: 6, description: 'Review for midterm'
    }
  },
  {
    id: 'g3',
    name: 'Quantum Physics Forum',
    subject: 'Physics',
    description: 'Advanced topics in quantum mechanics and wave functions.',
    members: [users[2], users[0], users[4], users[5]],
    maxMembers: 10,
    createdBy: 'u3',
    createdAt: '2024-09-15',
    tags: ['PHY401', 'Quantum', 'Advanced'],
    isPrivate: true,
    status: 'active',
    coverColor: '#7C3AED',
  },
  {
    id: 'g4',
    name: 'Organic Chemistry Lab Prep',
    subject: 'Chemistry',
    description: 'Pre-lab discussions and reaction mechanism reviews for CHEM202.',
    members: [users[3], users[1]],
    maxMembers: 5,
    createdBy: 'u4',
    createdAt: '2024-09-20',
    tags: ['CHEM202', 'Organic', 'Lab'],
    isPrivate: false,
    status: 'active',
    coverColor: '#EF4444',
  },
  {
    id: 'g5',
    name: 'ML & AI Reading Group',
    subject: 'Computer Science',
    description: 'Paper reading and implementation of modern ML architectures.',
    members: [users[0], users[4], users[2]],
    maxMembers: 8,
    createdBy: 'u5',
    createdAt: '2024-10-01',
    tags: ['ML', 'DeepLearning', 'Research'],
    isPrivate: false,
    status: 'active',
    coverColor: '#F97316',
  },
  {
    id: 'g6',
    name: 'Cell Biology Study Group',
    subject: 'Biology',
    description: 'Comprehensive review of cellular processes and molecular biology.',
    members: [users[5], users[3]],
    maxMembers: 6,
    createdBy: 'u6',
    createdAt: '2024-10-05',
    tags: ['BIO301', 'Cells', 'Molecular'],
    isPrivate: false,
    status: 'archived',
    coverColor: '#10B981',
  },
];

export const messages: Message[] = [
  { id: 'm1', groupId: 'g1', senderId: 'u2', senderName: 'Neha Patel', senderAvatar: 'NP', content: 'Hey everyone! Ready for tomorrow\'s DP session?', timestamp: '2026-03-30T10:00:00Z', type: 'text' },
  { id: 'm2', groupId: 'g1', senderId: 'u3', senderName: 'Rohan Kumar', senderAvatar: 'RK', content: 'Yes! I\'ve been practicing knapsack problems. Should we cover memoization vs tabulation?', timestamp: '2026-03-30T10:05:00Z', type: 'text' },
  { id: 'm3', groupId: 'g1', senderId: 'u1', senderName: 'Aryan Sharma', senderAvatar: 'AS', content: 'Great idea Rohan. I\'ll also bring the cheat sheet.', timestamp: '2026-03-30T10:08:00Z', type: 'text' },
  { id: 'm4', groupId: 'g1', senderId: 'u5', senderName: 'Amit Verma', senderAvatar: 'AV', content: '', timestamp: '2026-03-30T10:12:00Z', type: 'file', fileName: 'DP_Patterns_Notes.pdf', fileSize: '2.4 MB' },
  { id: 'm5', groupId: 'g1', senderId: 'u2', senderName: 'Neha Patel', senderAvatar: 'NP', content: 'This is super helpful Amit, thanks!', timestamp: '2026-03-30T10:15:00Z', type: 'text' },
  { id: 'm6', groupId: 'g1', senderId: 'u1', senderName: 'Aryan Sharma', senderAvatar: 'AS', content: 'Don\'t forget — session starts at 3PM sharp in Library Room 2A 📚', timestamp: '2026-03-30T10:20:00Z', type: 'text' },
];

export const sessions: StudySession[] = [
  { id: 's1', groupId: 'g1', title: 'Dynamic Programming Deep Dive', date: '2026-04-02', time: '15:00', duration: 90, location: 'Library Room 2A', isOnline: false, attendees: ['u1', 'u2', 'u3'], maxAttendees: 8, description: 'Covering DP patterns and LeetCode problems' },
  { id: 's2', groupId: 'g2', title: 'Line Integrals Review', date: '2026-04-03', time: '14:00', duration: 60, location: 'Zoom', isOnline: true, attendees: ['u2', 'u4'], maxAttendees: 6, description: 'Review for midterm' },
  { id: 's3', groupId: 'g5', title: 'Transformers Architecture Review', date: '2026-04-05', time: '11:00', duration: 120, location: 'CS Lab B102', isOnline: false, attendees: ['u1', 'u5'], maxAttendees: 8, description: 'Attention is all you need paper review' },
  { id: 's4', groupId: 'g3', title: 'Wave Functions & Superposition', date: '2026-04-06', time: '16:00', duration: 90, location: 'Physics Building 3F', isOnline: false, attendees: ['u2', 'u3'], maxAttendees: 10, description: 'Advanced quantum topics' },
  { id: 's5', groupId: 'g1', title: 'Graph Algorithms Workshop', date: '2026-04-09', time: '15:00', duration: 90, location: 'Library Room 2A', isOnline: false, attendees: ['u1', 'u3', 'u4'], maxAttendees: 8, description: 'BFS, DFS, Dijkstra, and more' },
];

export const sharedFiles: SharedFile[] = [
  { id: 'f1', groupId: 'g1', name: 'DP_Patterns_Notes.pdf', size: '2.4 MB', type: 'pdf', uploadedBy: 'Amit Verma', uploadedAt: '2026-03-30', url: '#' },
  { id: 'f2', groupId: 'g1', name: 'Leetcode_Top150.xlsx', size: '456 KB', type: 'spreadsheet', uploadedBy: 'Aryan Sharma', uploadedAt: '2026-03-28', url: '#' },
  { id: 'f3', groupId: 'g1', name: 'Sorting_Algorithms_Cheatsheet.png', size: '1.1 MB', type: 'image', uploadedBy: 'Neha Patel', uploadedAt: '2026-03-25', url: '#' },
  { id: 'f4', groupId: 'g2', name: 'Calculus_III_Formulas.pdf', size: '890 KB', type: 'pdf', uploadedBy: 'Neha Patel', uploadedAt: '2026-03-29', url: '#' },
  { id: 'f5', groupId: 'g5', name: 'Attention_Paper_Annotated.pdf', size: '5.2 MB', type: 'pdf', uploadedBy: 'Amit Verma', uploadedAt: '2026-03-27', url: '#' },
  { id: 'f6', groupId: 'g3', name: 'Quantum_Mechanics_Lectures.zip', size: '15.3 MB', type: 'archive', uploadedBy: 'Rohan Kumar', uploadedAt: '2026-03-22', url: '#' },
];
