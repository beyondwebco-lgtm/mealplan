import express from 'express';
import cors from 'cors';
import { pool, initDb } from './db';
import { generateAIMealPlan, generateAIRecipe, generateAIChat, validateGeminiKey } from './ai';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper to format group rows + member rows into Group objects
async function getFullGroup(groupId: string) {
  const groupRes = await pool.query('SELECT * FROM groups WHERE id = $1', [groupId]);
  if (groupRes.rows.length === 0) return null;

  const g = groupRes.rows[0];
  const membersRes = await pool.query(
    'SELECT * FROM members WHERE group_id = $1 ORDER BY created_at ASC',
    [groupId]
  );

  return {
    id: g.id,
    name: g.name,
    creatorName: g.creator_name,
    mealPlan: g.meal_plan,
    createdAt: g.created_at,
    updatedAt: g.updated_at,
    members: membersRes.rows.map((m) => ({
      id: m.id,
      name: m.name,
      avatarColor: m.avatar_color,
      likes: typeof m.likes === 'string' ? JSON.parse(m.likes) : m.likes || [],
      dislikes: typeof m.dislikes === 'string' ? JSON.parse(m.dislikes) : m.dislikes || [],
    })),
  };
}

// GET all groups with their members
app.get('/api/groups', async (_req, res) => {
  try {
    const groupsRes = await pool.query('SELECT * FROM groups ORDER BY created_at ASC');
    const groups = [];

    for (const g of groupsRes.rows) {
      const fullGroup = await getFullGroup(g.id);
      if (fullGroup) groups.push(fullGroup);
    }

    res.json(groups);
  } catch (err: any) {
    console.error('Error fetching groups:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET single group
app.get('/api/groups/:id', async (req, res) => {
  try {
    const group = await getFullGroup(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (err: any) {
    console.error('Error fetching group:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST create group
app.post('/api/groups', async (req, res) => {
  try {
    const { id, name, creatorName, members, mealPlan } = req.body;
    const groupId = id || `group-${Date.now()}`;

    await pool.query(
      `INSERT INTO groups (id, name, creator_name, meal_plan) VALUES ($1, $2, $3, $4)`,
      [groupId, name, creatorName, JSON.stringify(mealPlan || {})]
    );

    if (Array.isArray(members)) {
      for (const m of members) {
        const memberId = m.id || `member-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        await pool.query(
          `INSERT INTO members (id, group_id, name, avatar_color, likes, dislikes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [memberId, groupId, m.name, m.avatarColor || null, JSON.stringify(m.likes || []), JSON.stringify(m.dislikes || [])]
        );
      }
    }

    const created = await getFullGroup(groupId);
    res.status(201).json(created);
  } catch (err: any) {
    console.error('Error creating group:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST add member to group
app.post('/api/groups/:id/members', async (req, res) => {
  try {
    const groupId = req.params.id;
    const { id, name, avatarColor, likes, dislikes } = req.body;
    const memberId = id || `member-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    await pool.query(
      `INSERT INTO members (id, group_id, name, avatar_color, likes, dislikes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [memberId, groupId, name, avatarColor || null, JSON.stringify(likes || []), JSON.stringify(dislikes || [])]
    );

    await pool.query('UPDATE groups SET updated_at = NOW() WHERE id = $1', [groupId]);

    const updatedGroup = await getFullGroup(groupId);
    res.status(201).json(updatedGroup);
  } catch (err: any) {
    console.error('Error adding member:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update member
app.put('/api/groups/:id/members/:memberId', async (req, res) => {
  try {
    const { id: groupId, memberId } = req.params;
    const { name, likes, dislikes } = req.body;

    await pool.query(
      `UPDATE members
       SET name = COALESCE($1, name),
           likes = COALESCE($2, likes),
           dislikes = COALESCE($3, dislikes)
       WHERE id = $4 AND group_id = $5`,
      [name, JSON.stringify(likes), JSON.stringify(dislikes), memberId, groupId]
    );

    await pool.query('UPDATE groups SET updated_at = NOW() WHERE id = $1', [groupId]);

    const updatedGroup = await getFullGroup(groupId);
    res.json(updatedGroup);
  } catch (err: any) {
    console.error('Error updating member:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE member
app.delete('/api/groups/:id/members/:memberId', async (req, res) => {
  try {
    const { id: groupId, memberId } = req.params;

    await pool.query('DELETE FROM members WHERE id = $1 AND group_id = $2', [memberId, groupId]);
    await pool.query('UPDATE groups SET updated_at = NOW() WHERE id = $1', [groupId]);

    const updatedGroup = await getFullGroup(groupId);
    res.json(updatedGroup);
  } catch (err: any) {
    console.error('Error deleting member:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update meal plan
app.put('/api/groups/:id/mealplan', async (req, res) => {
  try {
    const groupId = req.params.id;
    const { mealPlan } = req.body;

    await pool.query(
      `UPDATE groups SET meal_plan = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(mealPlan), groupId]
    );

    const updatedGroup = await getFullGroup(groupId);
    res.json(updatedGroup);
  } catch (err: any) {
    console.error('Error updating meal plan:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST Gemini AI generate weekly meal plan
app.post('/api/ai/generate-meal-plan', async (req, res) => {
  try {
    const { members, style } = req.body;
    const plan = await generateAIMealPlan(members || [], style);
    res.json({ success: true, mealPlan: plan });
  } catch (err: any) {
    console.error('AI Meal Plan generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate meal plan with Gemini AI' });
  }
});

// POST Gemini AI recipe guide
app.post('/api/ai/recipe', async (req, res) => {
  try {
    const { dish, apiKey } = req.body;
    if (!dish) return res.status(400).json({ error: 'Dish name is required' });
    const recipe = await generateAIRecipe(dish, apiKey);
    res.json({ success: true, recipe });
  } catch (err: any) {
    console.error('AI Recipe generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate recipe with Gemini AI' });
  }
});

// POST Gemini AI interactive chat
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, groupContext, apiKey } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    const reply = await generateAIChat(messages, groupContext, apiKey);
    res.json({ success: true, reply });
  } catch (err: any) {
    console.error('AI Chat generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate chat response' });
  }
});

// POST Gemini AI validate API key
app.post('/api/ai/validate-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ error: 'API key is required' });
    const result = await validateGeminiKey(apiKey);
    res.json(result);
  } catch (err: any) {
    console.error('AI Key validation error:', err);
    res.status(500).json({ valid: false, error: err.message });
  }
});

// POST reset to sample demo data
app.post('/api/reset-demo', async (_req, res) => {
  try {
    await pool.query('DELETE FROM members');
    await pool.query('DELETE FROM groups');

    const sampleGroupId = 'group-our-weekly-meals';
    const sampleMealPlan = {
      monday: { breakfast: 'Idli & Sambar', lunch: 'Dal Tadka + Rice', dinner: 'Paneer Butter Masala + Roti' },
      tuesday: { breakfast: 'Poha', lunch: 'Aloo Curry + Chapati', dinner: 'Dal Tadka + Jeera Rice' },
      wednesday: { breakfast: 'Upma', lunch: 'Vegetable Biryani + Raita', dinner: 'Paneer Butter Masala + Phulka' },
      thursday: { breakfast: 'Dosa with Chutney', lunch: 'Dal Tadka + Steamed Rice', dinner: 'Chicken Curry / Paneer + Roti' },
      friday: { breakfast: 'Paratha with Curd', lunch: 'Aloo Curry + Rice', dinner: 'Vegetable Biryani' },
      saturday: { breakfast: 'Puri Bhaji', lunch: 'Paneer Butter Masala + Naan', dinner: 'Dal Tadka + Roti' },
      sunday: { breakfast: 'Masala Omelette / Paneer Toast', lunch: 'Special Dum Biryani + Salan', dinner: 'Light Khichdi & Papad' },
    };

    await pool.query(
      `INSERT INTO groups (id, name, creator_name, meal_plan) VALUES ($1, $2, $3, $4)`,
      [sampleGroupId, 'Our Weekly Meals', 'Rahul', JSON.stringify(sampleMealPlan)]
    );

    const sampleMembers = [
      {
        id: 'member-rahul',
        name: 'Rahul',
        avatarColor: 'bg-emerald-700',
        likes: ['Paneer Butter Masala', 'Dal Tadka', 'Vegetable Biryani', 'Roti'],
        dislikes: ['Brinjal Curry', 'Bitter Gourd Curry'],
      },
      {
        id: 'member-priya',
        name: 'Priya',
        avatarColor: 'bg-teal-700',
        likes: ['Dal Tadka', 'Paneer Butter Masala', 'Chapati', 'Aloo Curry'],
        dislikes: ['Fish Curry'],
      },
      {
        id: 'member-arjun',
        name: 'Arjun',
        avatarColor: 'bg-amber-700',
        likes: ['Chicken Curry', 'Vegetable Biryani', 'Dal Tadka'],
        dislikes: ['Brinjal Curry'],
      },
      {
        id: 'member-ananya',
        name: 'Ananya',
        avatarColor: 'bg-rose-700',
        likes: ['Paneer Butter Masala', 'Vegetable Biryani', 'Aloo Curry'],
        dislikes: ['Bitter Gourd Curry'],
      },
    ];

    for (const m of sampleMembers) {
      await pool.query(
        `INSERT INTO members (id, group_id, name, avatar_color, likes, dislikes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [m.id, sampleGroupId, m.name, m.avatarColor, JSON.stringify(m.likes), JSON.stringify(m.dislikes)]
      );
    }

    const demo = await getFullGroup(sampleGroupId);
    res.json({ success: true, group: demo });
  } catch (err: any) {
    console.error('Error resetting demo:', err);
    res.status(500).json({ error: err.message });
  }
});

// Start server after DB init
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running with Gemini AI & PostgreSQL on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server due to DB error:', err);
  });
