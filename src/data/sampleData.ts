import type { Group, WeeklyMealPlan } from '../types';

export const initialMealPlan: WeeklyMealPlan = {
  monday: {
    breakfast: 'Idli & Sambar',
    lunch: 'Dal Tadka + Rice',
    dinner: 'Paneer Butter Masala + Roti',
  },
  tuesday: {
    breakfast: 'Poha',
    lunch: 'Aloo Curry + Chapati',
    dinner: 'Dal Tadka + Jeera Rice',
  },
  wednesday: {
    breakfast: 'Upma',
    lunch: 'Vegetable Biryani + Raita',
    dinner: 'Paneer Butter Masala + Phulka',
  },
  thursday: {
    breakfast: 'Dosa with Chutney',
    lunch: 'Dal Tadka + Steamed Rice',
    dinner: 'Chicken Curry / Paneer + Roti',
  },
  friday: {
    breakfast: 'Paratha with Curd',
    lunch: 'Aloo Curry + Rice',
    dinner: 'Vegetable Biryani',
  },
  saturday: {
    breakfast: 'Puri Bhaji',
    lunch: 'Paneer Butter Masala + Naan',
    dinner: 'Dal Tadka + Roti',
  },
  sunday: {
    breakfast: 'Masala Omelette / Paneer Toast',
    lunch: 'Special Dum Biryani + Salan',
    dinner: 'Light Khichdi & Papad',
  },
};

export const emptyMealPlan: WeeklyMealPlan = {
  monday: { breakfast: '', lunch: '', dinner: '' },
  tuesday: { breakfast: '', lunch: '', dinner: '' },
  wednesday: { breakfast: '', lunch: '', dinner: '' },
  thursday: { breakfast: '', lunch: '', dinner: '' },
  friday: { breakfast: '', lunch: '', dinner: '' },
  saturday: { breakfast: '', lunch: '', dinner: '' },
  sunday: { breakfast: '', lunch: '', dinner: '' },
};

export const sampleGroup: Group = {
  id: 'group-our-weekly-meals',
  name: 'Our Weekly Meals',
  creatorName: 'Rahul',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  members: [
    {
      id: 'member-rahul',
      name: 'Rahul',
      avatarColor: 'bg-emerald-700',
      likes: [
        'Paneer Butter Masala',
        'Dal Tadka',
        'Vegetable Biryani',
        'Roti',
      ],
      dislikes: [
        'Brinjal Curry',
        'Bitter Gourd Curry',
      ],
    },
    {
      id: 'member-priya',
      name: 'Priya',
      avatarColor: 'bg-teal-700',
      likes: [
        'Dal Tadka',
        'Paneer Butter Masala',
        'Chapati',
        'Aloo Curry',
      ],
      dislikes: [
        'Fish Curry',
      ],
    },
    {
      id: 'member-arjun',
      name: 'Arjun',
      avatarColor: 'bg-amber-700',
      likes: [
        'Chicken Curry',
        'Vegetable Biryani',
        'Dal Tadka',
      ],
      dislikes: [
        'Brinjal Curry',
      ],
    },
    {
      id: 'member-ananya',
      name: 'Ananya',
      avatarColor: 'bg-rose-700',
      likes: [
        'Paneer Butter Masala',
        'Vegetable Biryani',
        'Aloo Curry',
      ],
      dislikes: [
        'Bitter Gourd Curry',
      ],
    },
  ],
  mealPlan: initialMealPlan,
};
