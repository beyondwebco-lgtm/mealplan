import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

function getClient(overrideKey?: string) {
  const apiKey = overrideKey || process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    throw new Error('Gemini API key is not configured.');
  }
  return new GoogleGenAI({ apiKey });
}

export async function suggestDishIdeas(
  prompt: string,
  context: {
    existingDishes: string[];
    popularLikes: string[];
    dislikedDishes: string[];
    members: { name: string; likedDishes: string[]; dislikedDishes: string[] }[];
  },
  overrideKey?: string
): Promise<Array<{ title: string; description: string; matchReason: string }>> {
  const client = getClient(overrideKey);
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const systemInstruction = `
You are a helpful culinary advisor for a shared group food ideas board called "MealTogether".
The group is looking for delicious meal and dish ideas.

GROUP TASTE PROFILE:
- Existing Board Ideas: ${context.existingDishes.join(', ') || 'None yet'}
- Top Group Favorites: ${context.popularLikes.join(', ') || 'None yet'}
- Dishes to Avoid/Disliked: ${context.dislikedDishes.join(', ') || 'None'}
- Members:
${context.members.map((m) => `  * ${m.name} likes [${m.likedDishes.join(', ')}], dislikes [${m.dislikedDishes.join(', ')}]`).join('\n')}

USER REQUEST: "${prompt || 'Suggest 4-5 great dish ideas for our group'}"

INSTRUCTIONS:
1. Provide 4 to 5 distinct, enticing dish suggestions that suit the group.
2. Strictly avoid any dishes or ingredients that the group members dislike.
3. Keep descriptions concise, appetizing, and friendly (1 sentence each).
4. Return ONLY a valid JSON array of objects with keys "title", "description", and "matchReason", with no markdown code fences:

[
  {
    "title": "Dish Name",
    "description": "Short appetizing 1-sentence description.",
    "matchReason": "Why it's great for the group"
  }
]
`;

  const response = await client.models.generateContent({
    model: modelName,
    contents: systemInstruction,
  });

  const rawText = response.text || '';
  const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch (err) {
    console.error('Failed to parse Gemini response as JSON:', rawText);
    throw new Error('Could not parse AI response');
  }
}
