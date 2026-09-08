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

  async sendAIChat(
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    groupContext?: {
      groupName?: string;
      members?: { name: string; likes: string[]; dislikes: string[] }[];
      mealPlan?: WeeklyMealPlan;
    },
    apiKey?: string
  ): Promise<string> {
    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, groupContext, apiKey }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }
      const data = await res.json();
      return data.reply;
    } catch (serverErr: any) {
      // Fallback: If custom API key is available, run direct client-side Gemini call
      if (apiKey && apiKey.trim().length > 0) {
        try {
          const { GoogleGenAI } = await import('@google/genai');
          const client = new GoogleGenAI({ apiKey: apiKey.trim() });

          let contextDescription = '';
          if (groupContext) {
            const { groupName, members, mealPlan } = groupContext;
            contextDescription = `
GROUP CONTEXT:
- Group Name: ${groupName || 'Meal Group'}
- Members & Preferences:
${
  members && members.length > 0
    ? members
        .map(
          (m) =>
            `  * ${m.name}:
      Likes: ${m.likes && m.likes.length ? m.likes.join(', ') : 'Open to anything'}
      Dislikes/Avoid: ${m.dislikes && m.dislikes.length ? m.dislikes.join(', ') : 'None'}`
        )
        .join('\n')
    : '  No members listed yet.'
}

CURRENT WEEKLY MEAL PLAN:
${
  mealPlan
    ? Object.entries(mealPlan)
        .map(
          ([day, meals]: [string, any]) =>
            `  * ${day.toUpperCase()}: Breakfast: "${meals?.breakfast || 'Not set'}", Lunch: "${meals?.lunch || 'Not set'}", Dinner: "${meals?.dinner || 'Not set'}"`
        )
        .join('\n')
    : '  No current plan set.'
}
`;
          }

          const systemInstruction = `You are "Chef Gemini", an expert culinary advisor and meal planner.
${contextDescription}
GUIDELINES:
1. Strictly respect member dislikes.
2. Prioritize group favorites.
3. Be concise and helpful with markdown format.
`;

          const conversationTranscript = messages
            .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
            .join('\n\n');

          const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `${systemInstruction}\n\nCONVERSATION HISTORY:\n${conversationTranscript}\n\nAssistant:`,
          });
          if (response.text) return response.text;
        } catch (clientErr: any) {
          throw new Error(clientErr.message || serverErr.message);
        }
      }
      throw serverErr;
    }
  },

  async validateAIKey(apiKey: string): Promise<{ valid: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/ai/validate-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      if (res.ok) {
        return res.json();
      }
    } catch {
      // ignore and fallback to client-side check
    }

    // Direct client-side validation fallback
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const client = new GoogleGenAI({ apiKey: apiKey.trim() });
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Ping test. Reply with: OK',
      });
      if (response && response.text) {
        return { valid: true };
      }
      return { valid: false, message: 'No response from Gemini API' };
    } catch (err: any) {
      return { valid: false, error: err.message || 'Key validation failed' };
    }
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

  async suggestMealIdeas(
    query: string,
    members: Member[],
    apiKey?: string
  ): Promise<Array<{
    title: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'any';
    description: string;
    matchReason: string;
    prepTime: string;
    cookTime: string;
    ingredients: string[];
    quickSteps?: string[];
  }>> {
    try {
      const res = await fetch(`${API_BASE}/ai/suggest-ideas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, members, apiKey }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to suggest meal ideas');
      }
      const data = await res.json();
      return data.ideas;
    } catch (serverErr: any) {
      // Fallback: If custom API key is available, run direct client-side Gemini call
      if (apiKey && apiKey.trim().length > 0) {
        try {
          const { GoogleGenAI } = await import('@google/genai');
          const client = new GoogleGenAI({ apiKey: apiKey.trim() });

          const prompt = `
You are an expert culinary AI Chef.
The user wants meal ideas or dishes based on their request: "${query}".

GROUP TASTE PROFILES:
${members
  .map(
    (m) =>
      `- ${m.name}: Likes: [${m.likes.join(', ')}], Dislikes/Avoid: [${m.dislikes.join(', ')}]`
  )
  .join('\n')}

INSTRUCTIONS:
1. Suggest 3 to 4 distinct, delicious dish ideas matching the user's request.
2. STRICTLY respect member dislikes.
3. Output ONLY a valid JSON array of objects without markdown code blocks:

[
  {
    "title": "Dish Name",
    "mealType": "dinner",
    "description": "Short appetizing description",
    "matchReason": "Why it suits the group",
    "prepTime": "15 mins",
    "cookTime": "20 mins",
    "ingredients": ["Item 1", "Item 2"],
    "quickSteps": ["Step 1", "Step 2"]
  }
]
`;

          const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
          });
          const rawText = response.text || '';
          const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
          return JSON.parse(cleaned);
        } catch (clientErr: any) {
          throw new Error(clientErr.message || serverErr.message);
        }
      }
      throw serverErr;
    }
  },
};
