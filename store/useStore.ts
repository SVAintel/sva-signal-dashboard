import { create } from "zustand";

interface StoreState {
  activeCategories: string[];
  toggleCategory: (category: string) => void;
  setAllCategories: (categories: string[]) => void;
  dashboardActive: boolean;
  setDashboardActive: (active: boolean) => void;
}

const ALL_CATEGORIES = ["war", "counter_terrorism", "natural_disaster", "market", "biological", "political_unrest", "cyber", "nuclear", "energy", "humanitarian"];

export const useStore = create<StoreState>((set) => ({
  activeCategories: ALL_CATEGORIES, // all on by default
  toggleCategory: (category) =>
    set((state) => ({
      activeCategories: state.activeCategories.includes(category)
        ? state.activeCategories.filter((c) => c !== category)
        : [...state.activeCategories, category],
    })),
  setAllCategories: (categories) => set({ activeCategories: categories }),
  dashboardActive: false,
  setDashboardActive: (active) => set({ dashboardActive: active }),
}));

export { ALL_CATEGORIES };
