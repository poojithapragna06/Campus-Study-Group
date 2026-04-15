export interface User {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  role?: 'student' | 'admin';
  department?: string;
  year?: number;
  joinedAt?: string;
  groupsJoined?: number;
  sessionsAttended?: number;
}

export interface StudyGroup {
  id: string;
  name: string;
  subject: string;
  description: string;
  members: User[];
  maxMembers: number;
  createdBy: string;
  createdAt: string;
  tags: string[];
  isPrivate: boolean;
  status: 'active' | 'archived';
  nextSession?: StudySession;
  coverColor: string;
}

export interface StudySession {
  id: string;
  groupId: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  isOnline: boolean;
  attendees: string[];
  maxAttendees: number;
  description: string;
}

export interface Message {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  type: 'text' | 'file' | 'image';
  fileName?: string;
  fileSize?: string;
}

export interface SharedFile {
  id: string;
  groupId: string;
  name: string;
  size: string;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
}
export interface Friend {
  username: string;
}

export interface FriendRequest {
  senderId: string;
  username: string;
}

export interface UserSearchResult {
  userID: string;
  username: string;
}

export interface RealGroupChat {
  _id: string;
  group_name: string;
  group_members: string[];
  group_admins: string[];
  requires_permission: boolean;
  messages: GroupMessage[];
}

export interface GroupMessage {
  senderId: string;
  content: string;
  timestamp: string;
}

// Add 'friends' to your existing ActiveView union:
export type ActiveView =
  | 'dashboard'
  | 'groups'
  | 'chat'
  | 'sessions'
  | 'files'
  | 'admin'
  | 'friends';   // ← add this
// export type ActiveView = 'dashboard' | 'groups' | 'chat' | 'sessions' | 'files' | 'admin';
type RealGroup = {
  _id: string;
  group_name: string;
  group_members: string[];
  group_admins: string[];
  requires_permission: boolean;
};