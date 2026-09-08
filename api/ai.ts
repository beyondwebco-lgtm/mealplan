import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const defaultApiKey = process.env.GEMINI_API_KEY || '';

// Try preferred models in order
const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
];

function getAiClient(customApiKey?: string): GoogleGenAI {
  const keyToUse = customApiKey && customApiKey.trim().length > 0 ? customApiKey.trim() : defaultApiKey;
  if (!keyToUse) {
    throw new Error('Gemini API key is not configured. Please provide an API key.');
  }
  return new GoogleGenAI({ apiKey: keyToUse });
}

export async function generateContentWithFallback(prompt: string, customApiKey?: string): Promise<string> {
  const client = getAiClient(customApiKey);
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: prompt,
      });
      if (response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} failed, trying next...:`, err.message);
    }
  }

  throw lastError || new Error('Failed to generate content with Gemini AI');
}

/**
 * Validate a user-provided Gemini API key
 */
export async function validateGeminiKey(apiKey: string): Promise<{ valid: boolean; message?: string }> {
  try {
    const client = new GoogleGenAI({ apiKey: apiKey.trim() });
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Ping test. Reply with: OK',
    });
    if (response && response.text) {
      return { valid: true };
    }
    return { valid: false, message: 'No response received from Gemini' };
  } catch (err: any) {
    return { valid: false, message: err.message || 'Invalid Gemini API key' };
  }
}

/**
 * AI Chat Assistant for Meals, Recipes, Member Taste Preferences, and Schedules
 */
export async function generateAIChat(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  groupContext?: {
    groupName?: string;
    members?: { name: string; likes: string[]; dislikes: string[] }[];
    mealPlan?: any;
  },
  customApiKey?: string
): Promise<string> {
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
      Dislikes/Allergies/Avoid: ${m.dislikes && m.dislikes.length ? m.dislikes.join(', ') : 'None'}`
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

  const systemInstruction = `
You are "Chef Gemini", an expert culinary advisor, nutritionist, and collaborative meal planning assistant.
You help flatmates, families, and meal groups coordinate meals, resolve taste conflicts, generate recipe steps, provide substitutions, and recommend dishes tailored to everyone's preferences.

${contextDescription}

GUIDELINES:
1. Always respect members' dislikes and restrictions strictly when suggesting meals or ingredients.
2. Highlight dishes that satisfy multiple members' likes when possible.
3. Keep responses friendly, concise, appetizing, and well-structured using markdown formatting (bullet points, bold highlights, numbered instructions for recipes).
4. If the user asks for a recipe, provide quick prep time, cook time, ingredients with quantities, and clear steps.
5. If the user asks for a substitution or conflict resolution, give practical alternatives that keep everyone happy.
`;

  // Format conversation history
  const conversationTranscript = messages
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n');

  const fullPrompt = `${systemInstruction}\n\nCONVERSATION HISTORY:\n${conversationTranscript}\n\nAssistant:`;

  return await generateContentWithFallback(fullPrompt, customApiKey);
}

/**
 * AI-generated Weekly Meal Plan based on member preferences
 */
export async function generateAIMealPlan(
  members: { name: string; likes: string[]; dislikes: string[] }[],
  customApiKey?: string
) {
  const prompt = `
You are an expert culinary meal planner.
Generate a structured 7-day weekly meal plan (Monday to Sunday) for a group with the following member taste profiles:

${members
  .map(
    (m) =>
      `- Member: ${m.name}\n  Likes: ${m.likes.length ? m.likes.join(', ') : 'Open to anything'}\n  Dislikes/Avoid: ${
        m.dislikes.length ? m.dislikes.join(', ') : 'None'
      }`
  )
  .join('\n\n')}

CRITICAL INSTRUCTIONS:
1. Prioritize meals that incorporate the group's liked dishes and flavor profiles.
2. STRICTLY AVOID any ingredients, curries, or dishes listed in any member's dislikes.
3. Keep meals realistic, nutritious, satisfying, and balanced across Breakfast, Lunch, and Dinner.
4. Output MUST be ONLY valid JSON in the exact structure below without markdown formatting or code fences:

{
  "monday": { "breakfast": "...", "lunch": "...", "dinner": "..." },
  "tuesday": { "breakfast": "...", "lunch": "...", "dinner": "..." },
  "wednesday": { "breakfast": "...", "lunch": "...", "dinner": "..." },
  "thursday": { "breakfast": "...", "lunch": "...", "dinner": "..." },
  "friday": { "breakfast": "...", "lunch": "...", "dinner": "..." },
  "saturday": { "breakfast": "...", "lunch": "...", "dinner": "..." },
  "sunday": { "breakfast": "...", "lunch": "...", "dinner": "..." }
}
`;

  const rawText = await generateContentWithFallback(prompt, customApiKey);
  const cleaned = rawText
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  return JSON.parse(cleaned);
}

/**
 * AI Chef: Detailed recipe, ingredients, and preparation steps for any meal
 */
export async function generateAIRecipe(dishName: string, customApiKey?: string) {
  const prompt = `
You are a friendly master chef. Provide a quick recipe guide for the dish: "${dishName}".
Output ONLY a valid JSON object with the following structure without markdown code blocks:

{
  "dish": "${dishName}",
  "prepTime": "15 mins",
  "cookTime": "25 mins",
  "servings": "3-4 people",
  "ingredients": [
    "item 1 with quantity",
    "item 2 with quantity"
  ],
  "steps": [
    "Step 1 instruction",
    "Step 2 instruction"
  ],
  "chefTips": "A quick pro-tip for maximum flavor."
}
`;

  const rawText = await generateContentWithFallback(prompt, customApiKey);
  const cleaned = rawText
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  return JSON.parse(cleaned);
}
