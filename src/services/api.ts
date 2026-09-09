import type { AppState } from '../types';

const API_BASE = '/api';

export const api = {
  async fetchBoard(groupId: string = 'group-mealtogether'): Promise<AppState> {
    const res = await fetch(`${API_BASE}/board?groupId=${encodeURIComponent(groupId)}`);
    if (!res.ok) throw new Error('Failed to fetch board data');
    return res.json();
  },

  async addDish(data: {
    groupId?: string;
    name: string;
    suggestedBy: string;
    suggestedByMemberId?: string;
  }): Promise<AppState> {
    const res = await fetch(`${API_BASE}/dishes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add dish');
    return res.json();
  },

  async deleteDish(dishId: string, groupId: string = 'group-mealtogether'): Promise<AppState> {
    const res = await fetch(`${API_BASE}/dishes/${dishId}?groupId=${encodeURIComponent(groupId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete dish');
    return res.json();
  },

  async toggleLike(dishId: string, memberId: string, groupId: string = 'group-mealtogether'): Promise<AppState> {
    const res = await fetch(`${API_BASE}/dishes/${dishId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, groupId }),
    });
    if (!res.ok) throw new Error('Failed to update like');
    return res.json();
  },

  async toggleDislike(dishId: string, memberId: string, groupId: string = 'group-mealtogether'): Promise<AppState> {
    const res = await fetch(`${API_BASE}/dishes/${dishId}/dislike`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, groupId }),
    });
    if (!res.ok) throw new Error('Failed to update dislike');
    return res.json();
  },

  async addMember(data: { groupId?: string; name: string; avatarColor?: string }): Promise<AppState> {
    const res = await fetch(`${API_BASE}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add member');
    return res.json();
  },

  async deleteMember(memberId: string, groupId: string = 'group-mealtogether'): Promise<AppState> {
    const res = await fetch(`${API_BASE}/members/${memberId}?groupId=${encodeURIComponent(groupId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete member');
    return res.json();
  },

  async getAISuggestions(
    prompt: string,
    context: {
      existingDishes: string[];
      popularLikes: string[];
      dislikedDishes: string[];
      members: { name: string; likedDishes: string[]; dislikedDishes: string[] }[];
    },
    apiKey?: string
  ): Promise<Array<{ title: string; description: string; matchReason: string }>> {
    try {
      const res = await fetch(`${API_BASE}/ai/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context, apiKey }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to get suggestions');
      }
      const data = await res.json();
      return data.suggestions || [];
    } catch (serverErr: any) {
      // Direct browser fallback if custom API key is present
      if (apiKey && apiKey.trim()) {
        try {
          const { GoogleGenAI } = await import('@google/genai');
          const client = new GoogleGenAI({ apiKey: apiKey.trim() });
          const promptText = `
You are a helpful culinary advisor for a shared group food ideas board called "MealTogether".
GROUP TASTE PROFILE:
- Existing Board Ideas: ${context.existingDishes.join(', ') || 'None'}
- Top Group Favorites: ${context.popularLikes.join(', ') || 'None'}
- Dishes to Avoid/Disliked: ${context.dislikedDishes.join(', ') || 'None'}
- Members:
${context.members.map((m) => `  * ${m.name} likes [${m.likedDishes.join(', ')}], dislikes [${m.dislikedDishes.join(', ')}]`).join('\n')}

USER REQUEST: "${prompt || 'Suggest 4-5 great dish ideas'}"

Return ONLY a JSON array of 4-5 items with title, description, and matchReason without markdown:
[
  {
    "title": "Dish Name",
    "description": "Short appetizing description",
    "matchReason": "Why it fits the group"
  }
]
`;
          const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: promptText,
          });
          const raw = (response.text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
          return JSON.parse(raw);
        } catch (clientErr: any) {
          throw new Error(clientErr.message || serverErr.message);
        }
      }
      throw serverErr;
    }
  },
};
