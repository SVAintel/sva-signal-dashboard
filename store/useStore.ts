import { create } from "zustand";

export type UserProfile = "osint" | "finance" | "military" | null;

interface StoreState {
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
}

export const useStore = create<StoreState>((set) => ({
  userProfile: null,
  setUserProfile: (profile) => set({ userProfile: profile }),
  selectedCategory: null,
  setSelectedCategory: (category) => set({ selectedCategory: category }),
}));
