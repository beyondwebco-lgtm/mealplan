export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface MealSlot {
  breakfast: string;
  lunch: string;
  dinner: string;
}

export type WeeklyMealPlan = Record<DayKey, MealSlot>;

export interface Member {
  id: string;
  name: string;
  likes: string[];
  dislikes: string[];
  avatarColor?: string;
}

export interface Group {
  id: string;
  name: string;
  creatorName: string;
  members: Member[];
  mealPlan: WeeklyMealPlan;
  createdAt: string;
  updatedAt: string;
}

export interface PreferenceStat {
  dish: string;
  originalNames: string[];
  count: number;
  members: string[]; // member names
}

export interface HarmonyStat {
  dish: string;
  likeCount: number;
  dislikeCount: number;
  likedBy: string[];
  dislikedBy: string[];
}

export type NavigationTab = 'dashboard' | 'members' | 'mealplan' | 'summary';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}
