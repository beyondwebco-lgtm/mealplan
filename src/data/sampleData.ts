import type { Group, Member, Dish } from '../types';

export const sampleGroup: Group = {
  id: 'group-mealtogether',
  name: 'MealTogether',
  createdAt: new Date().toISOString(),
};

export const sampleMembers: Member[] = [
  {
    id: 'member-jinka',
    groupId: 'group-mealtogether',
    name: 'Jinka',
    avatarColor: 'bg-emerald-700',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'member-arun',
    groupId: 'group-mealtogether',
    name: 'Arun',
    avatarColor: 'bg-teal-700',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'member-maneesh',
    groupId: 'group-mealtogether',
    name: 'Maneesh',
    avatarColor: 'bg-stone-700',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'member-vishwa',
    groupId: 'group-mealtogether',
    name: 'Vishwa',
    avatarColor: 'bg-amber-700',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'member-saipavan',
    groupId: 'group-mealtogether',
    name: 'Sai Pavan',
    avatarColor: 'bg-indigo-700',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'member-tata',
    groupId: 'group-mealtogether',
    name: 'Tata',
    avatarColor: 'bg-rose-700',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'member-indra',
    groupId: 'group-mealtogether',
    name: 'Indra',
    avatarColor: 'bg-blue-700',
    createdAt: new Date().toISOString(),
  },
];

export const sampleDishes: Dish[] = [];

