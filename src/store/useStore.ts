import { create } from 'zustand';
import type { Activity, Book, ActivityStats, CollaborationRequest } from '../../shared/types.ts';
import api from '../utils/api.ts';

interface StoreState {
  books: Book[];
  activities: Activity[];
  activityStats: Record<string, ActivityStats>;
  collaborations: CollaborationRequest[];
  loading: Record<string, boolean>;
  error: string | null;

  fetchBooks: (search?: string, category?: string) => Promise<void>;
  fetchActivities: (status?: Activity['status']) => Promise<void>;
  fetchActivityStats: (activityId: string) => Promise<void>;
  fetchCollaborations: (status?: CollaborationRequest['status']) => Promise<void>;
  createActivity: (data: Omit<Activity, 'id' | 'createdAt'>) => Promise<Activity>;
  updateActivity: (id: string, updates: Partial<Activity>) => Promise<void>;
  createCollaboration: (data: Omit<CollaborationRequest, 'id' | 'status' | 'createdAt'>) => Promise<CollaborationRequest>;
  replyToCollaboration: (id: string, replyType: CollaborationRequest['replyType'], replyNote?: string) => Promise<void>;
  updateCollaboration: (id: string, updates: Partial<CollaborationRequest>) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  books: [],
  activities: [],
  activityStats: {},
  collaborations: [],
  loading: {},
  error: null,

  fetchBooks: async (search, category) => {
    set({ loading: { ...get().loading, books: true } });
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      const url = params.toString() ? `/books?${params.toString()}` : '/books';
      const books = await api.get<Book[]>(url);
      set({ books });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: { ...get().loading, books: false } });
    }
  },

  fetchActivities: async (status) => {
    set({ loading: { ...get().loading, activities: true } });
    try {
      const url = status ? `/activities?status=${status}` : '/activities';
      const activities = await api.get<Activity[]>(url);
      set({ activities });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: { ...get().loading, activities: false } });
    }
  },

  fetchActivityStats: async (activityId) => {
    set({ loading: { ...get().loading, [`stats_${activityId}`]: true } });
    try {
      const stats = await api.get<ActivityStats>(`/activities/${activityId}/stats`);
      set({
        activityStats: { ...get().activityStats, [activityId]: stats },
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: { ...get().loading, [`stats_${activityId}`]: false } });
    }
  },

  fetchCollaborations: async (status) => {
    set({ loading: { ...get().loading, collaborations: true } });
    try {
      const url = status ? `/collaborations?status=${status}` : '/collaborations';
      const collaborations = await api.get<CollaborationRequest[]>(url);
      set({ collaborations });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: { ...get().loading, collaborations: false } });
    }
  },

  createActivity: async (data) => {
    set({ loading: { ...get().loading, createActivity: true } });
    try {
      const activity = await api.post<Activity>('/activities', data);
      set({ activities: [activity, ...get().activities] });
      return activity;
    } finally {
      set({ loading: { ...get().loading, createActivity: false } });
    }
  },

  updateActivity: async (id, updates) => {
    set({ loading: { ...get().loading, [`update_${id}`]: true } });
    try {
      await api.put(`/activities/${id}`, updates);
      set({
        activities: get().activities.map(a =>
          a.id === id ? { ...a, ...updates } : a
        ),
      });
    } finally {
      set({ loading: { ...get().loading, [`update_${id}`]: false } });
    }
  },

  createCollaboration: async (data) => {
    set({ loading: { ...get().loading, createCollab: true } });
    try {
      const collab = await api.post<CollaborationRequest>('/collaborations', data);
      set({ collaborations: [collab, ...get().collaborations] });
      return collab;
    } finally {
      set({ loading: { ...get().loading, createCollab: false } });
    }
  },

  replyToCollaboration: async (id, replyType, replyNote) => {
    set({ loading: { ...get().loading, [`reply_${id}`]: true } });
    try {
      await api.put(`/collaborations/${id}/reply`, { replyType, replyNote });
      set({
        collaborations: get().collaborations.map((c) =>
          c.id === id
            ? {
                ...c,
                status: 'replied' as const,
                replyType,
                replyNote,
                repliedAt: new Date().toISOString(),
              }
            : c
        ),
      });
    } finally {
      set({ loading: { ...get().loading, [`reply_${id}`]: false } });
    }
  },

  updateCollaboration: async (id, updates) => {
    set({ loading: { ...get().loading, [`updateCollab_${id}`]: true } });
    try {
      await api.put(`/collaborations/${id}`, updates);
      set({
        collaborations: get().collaborations.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      });
    } finally {
      set({ loading: { ...get().loading, [`updateCollab_${id}`]: false } });
    }
  },

  setError: (error) => set({ error }),
}));
