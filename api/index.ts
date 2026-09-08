import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
});

let dbInitialized = false;

async function ensureDbInit() {
  if (dbInitialized) return;
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        creator_name VARCHAR(255) NOT NULL,
        meal_plan JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS members (
        id VARCHAR(255) PRIMARY KEY,
        group_id VARCHAR(255) NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        avatar_color VARCHAR(100),
        likes JSONB NOT NULL DEFAULT '[]'::jsonb,
        dislikes JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_members_group_id ON members(group_id);
    `);

    const checkRes = await client.query('SELECT COUNT(*) FROM groups');
    const count = parseInt(checkRes.rows[0].count, 10);
    if (count === 0) {
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

      await client.query(
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
        await client.query(
          `INSERT INTO members (id, group_id, name, avatar_color, likes, dislikes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [m.id, sampleGroupId, m.name, m.avatarColor, JSON.stringify(m.likes), JSON.stringify(m.dislikes)]
        );
      }
    }
    dbInitialized = true;
  } catch (err) {
    console.error('ensureDbInit error:', err);
  } finally {
    client.release();
  }
}

const app = express();

app.use(cors());
app.use(express.json());

// Middleware to ensure DB connection
app.use(async (_req, _res, next) => {
  await ensureDbInit();
  next();
});

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

// Router matching both /api/* (direct or proxied) and /* (when mounted on /api on Vercel)
const router = express.Router();

router.get('/groups', async (_req, res) => {
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

router.get('/groups/:id', async (req, res) => {
  try {
    const group = await getFullGroup(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (err: any) {
    console.error('Error fetching group:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/groups', async (req, res) => {
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

router.post('/groups/:id/members', async (req, res) => {
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

router.put('/groups/:id/members/:memberId', async (req, res) => {
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

router.delete('/groups/:id/members/:memberId', async (req, res) => {
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

router.put('/groups/:id/mealplan', async (req, res) => {
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

router.post('/reset-demo', async (_req, res) => {
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

router.post('/ai/generate-meal-plan', async (req, res) => {
  try {
    const { members, apiKey } = req.body;
    const { generateAIMealPlan } = await import('../server/ai');
    const plan = await generateAIMealPlan(members || [], apiKey);
    res.json({ success: true, mealPlan: plan });
  } catch (err: any) {
    console.error('AI Meal Plan generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate meal plan with Gemini AI' });
  }
});

router.post('/ai/recipe', async (req, res) => {
  try {
    const { dish, apiKey } = req.body;
    if (!dish) return res.status(400).json({ error: 'Dish name is required' });
    const { generateAIRecipe } = await import('../server/ai');
    const recipe = await generateAIRecipe(dish, apiKey);
    res.json({ success: true, recipe });
  } catch (err: any) {
    console.error('AI Recipe generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate recipe with Gemini AI' });
  }
});

router.post('/ai/chat', async (req, res) => {
  try {
    const { messages, groupContext, apiKey } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    const { generateAIChat } = await import('../server/ai');
    const reply = await generateAIChat(messages, groupContext, apiKey);
    res.json({ success: true, reply });
  } catch (err: any) {
    console.error('AI Chat generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate chat response' });
  }
});

router.post('/ai/validate-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ error: 'API key is required' });
    const { validateGeminiKey } = await import('../server/ai');
    const result = await validateGeminiKey(apiKey);
    res.json(result);
  } catch (err: any) {
    console.error('AI Key validation error:', err);
    res.status(500).json({ valid: false, error: err.message });
  }
});

// Support both /api prefix and direct root
app.use('/api', router);
app.use('/', router);

export default app;
