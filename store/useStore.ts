import { create } from "zustand";

export type UserProfile = "osint" | "finance" | "military" | null;

interface StoreState {
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  dashboardActive: boolean;
  setDashboardActive: (active: boolean) => void;
}

export const useStore = create<StoreState>((set) => ({
  userProfile: "osint", // Default profile
  setUserProfile: (profile) => set({ userProfile: profile }),
  selectedCategory: null,
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  dashboardActive: false,
  setDashboardActive: (active) => set({ dashboardActive: active }),
}));
