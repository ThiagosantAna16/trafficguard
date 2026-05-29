import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  firebaseUid: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setFirebaseUid: (uid: string | null) => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  firebaseUid: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setFirebaseUid: (uid) => set({ firebaseUid: uid }),
  setLoading: (isLoading) => set({ isLoading }),
}));
