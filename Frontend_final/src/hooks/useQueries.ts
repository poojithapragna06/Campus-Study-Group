import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api';
import { StudyGroup, StudySession, Message, SharedFile } from '../types';

// ─── Query Keys (typed constants) ─────────────────────────────────────────────
export const QK = {
  groups: ['groups'] as const,
  group: (id: string) => ['groups', id] as const,
  sessions: ['sessions'] as const,
  messages: (groupId: string) => ['messages', groupId] as const,
  files: ['files'] as const,
  users: ['users'] as const,
  stats: (userId: string) => ['stats', userId] as const,
};

// ─── Groups ───────────────────────────────────────────────────────────────────

export function useGroups() {
  return useQuery({
    queryKey: QK.groups,
    queryFn: api.fetchGroups,
    staleTime: 1000 * 60 * 2, // 2 min
  });
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: QK.group(id),
    queryFn: () => api.fetchGroupById(id),
    enabled: !!id,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createGroup,
    onSuccess: (newGroup) => {
      qc.setQueryData<StudyGroup[]>(QK.groups, (prev = []) => [...prev, newGroup]);
    },
  });
}

export function useArchiveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.archiveGroup,
    onSuccess: (updated) => {
      qc.setQueryData<StudyGroup[]>(QK.groups, (prev = []) =>
        prev.map(g => (g.id === updated.id ? updated : g))
      );
    },
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteGroup,
    onSuccess: (_, id) => {
      qc.setQueryData<StudyGroup[]>(QK.groups, (prev = []) =>
        prev.filter(g => g.id !== id)
      );
    },
  });
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export function useSessions() {
  return useQuery({
    queryKey: QK.sessions,
    queryFn: api.fetchSessions,
    staleTime: 1000 * 60,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createSession,
    onSuccess: (newSession) => {
      qc.setQueryData<StudySession[]>(QK.sessions, (prev = []) => [...prev, newSession]);
    },
  });
}

export function useRsvpSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, userId }: { sessionId: string; userId: string }) =>
      api.rsvpSession(sessionId, userId),
    onSuccess: (updated) => {
      qc.setQueryData<StudySession[]>(QK.sessions, (prev = []) =>
        prev.map(s => (s.id === updated.id ? updated : s))
      );
    },
  });
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export function useMessages(groupId: string) {
  return useQuery({
    queryKey: QK.messages(groupId),
    queryFn: () => api.fetchMessages(groupId),
    enabled: !!groupId,
    refetchInterval: 5000, // poll every 5s to simulate real-time
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.sendMessage,
    onSuccess: (newMsg) => {
      qc.setQueryData<Message[]>(QK.messages(newMsg.groupId), (prev = []) => [
        ...prev,
        newMsg,
      ]);
    },
  });
}

// ─── Files ────────────────────────────────────────────────────────────────────

export function useFiles() {
  return useQuery({
    queryKey: QK.files,
    queryFn: api.fetchFiles,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDeleteFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteFile,
    onSuccess: (_, id) => {
      qc.setQueryData<SharedFile[]>(QK.files, (prev = []) =>
        prev.filter(f => f.id !== id)
      );
    },
  });
}

export function useUploadFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.uploadFile,
    onSuccess: (newFile) => {
      qc.setQueryData<SharedFile[]>(QK.files, (prev = []) => [newFile, ...prev]);
    },
  });
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function useUsers() {
  return useQuery({
    queryKey: QK.users,
    queryFn: api.fetchUsers,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteUser,
    onSuccess: (_, id) => {
      qc.setQueryData(QK.users, (prev: any[] = []) =>
        prev.filter(u => u.id !== id)
      );
    },
  });
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export function useDashboardStats(userId: string) {
  return useQuery({
    queryKey: QK.stats(userId),
    queryFn: () => api.fetchDashboardStats(userId),
    staleTime: 1000 * 30,
  });
}
