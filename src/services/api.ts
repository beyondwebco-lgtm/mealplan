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

  async sendAIChat(
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    groupContext?: {
      groupName?: string;
      members?: { name: string; likes: string[]; dislikes: string[] }[];
      mealPlan?: WeeklyMealPlan;
    },
    apiKey?: string
  ): Promise<string> {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, groupContext, apiKey }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to get response from AI');
    }
    const data = await res.json();
    return data.reply;
  },

  async validateAIKey(apiKey: string): Promise<{ valid: boolean; message?: string; error?: string }> {
    const res = await fetch(`${API_BASE}/ai/validate-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { valid: false, error: errData.error || 'Validation failed' };
    }
    return res.json();
  },

  async generateAIMealPlan(members: Member[], apiKey?: string): Promise<WeeklyMealPlan> {
    const res = await fetch(`${API_BASE}/ai/generate-meal-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ members, apiKey }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to generate meal plan');
    }
    const data = await res.json();
    return data.mealPlan;
  },

  async generateAIRecipe(dish: string, apiKey?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/recipe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dish, apiKey }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to generate recipe');
    }
    const data = await res.json();
    return data.recipe;
  },
};
