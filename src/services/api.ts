import type { Group, Member, WeeklyMealPlan } from '../types';

const API_BASE = '/api';

export const api = {
  async fetchGroups(): Promise<Group[]> {
    const res = await fetch(`${API_BASE}/groups`);
    if (!res.ok) throw new Error('Failed to fetch groups');
    return res.json();
  },

  async fetchGroup(id: string): Promise<Group> {
    const res = await fetch(`${API_BASE}/groups/${id}`);
    if (!res.ok) throw new Error('Failed to fetch group');
    return res.json();
  },

  async createGroup(data: { name: string; creatorName: string; members?: Member[]; mealPlan?: WeeklyMealPlan }): Promise<Group> {
    const res = await fetch(`${API_BASE}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create group');
    return res.json();
  },

  async addMember(groupId: string, member: { name: string; likes: string[]; dislikes: string[]; avatarColor?: string }): Promise<Group> {
    const res = await fetch(`${API_BASE}/groups/${groupId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    });
    if (!res.ok) throw new Error('Failed to add member');
    return res.json();
  },

  async updateMember(groupId: string, memberId: string, data: { name?: string; likes?: string[]; dislikes?: string[] }): Promise<Group> {
    const res = await fetch(`${API_BASE}/groups/${groupId}/members/${memberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update member');
    return res.json();
  },

  async deleteMember(groupId: string, memberId: string): Promise<Group> {
    const res = await fetch(`${API_BASE}/groups/${groupId}/members/${memberId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete member');
    return res.json();
  },

  async updateMealPlan(groupId: string, mealPlan: WeeklyMealPlan): Promise<Group> {
    const res = await fetch(`${API_BASE}/groups/${groupId}/mealplan`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mealPlan }),
    });
    if (!res.ok) throw new Error('Failed to update meal plan');
    return res.json();
  },

  async resetDemo(): Promise<Group> {
    const res = await fetch(`${API_BASE}/reset-demo`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reset demo');
    const data = await res.json();
    return data.group;
  },
};
