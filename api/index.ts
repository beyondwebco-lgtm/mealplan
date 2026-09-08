import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { suggestDishIdeas } from './ai';

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
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS members (
        id VARCHAR(255) PRIMARY KEY,
        group_id VARCHAR(255) NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        avatar_color VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS dishes (
        id VARCHAR(255) PRIMARY KEY,
        group_id VARCHAR(255) NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        suggested_by VARCHAR(255) NOT NULL,
        suggested_by_member_id VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS likes (
        id VARCHAR(255) PRIMARY KEY,
        member_id VARCHAR(255) NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        dish_id VARCHAR(255) NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT likes_member_dish_unique UNIQUE (member_id, dish_id)
      );

      CREATE TABLE IF NOT EXISTS dislikes (
        id VARCHAR(255) PRIMARY KEY,
        member_id VARCHAR(255) NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        dish_id VARCHAR(255) NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT dislikes_member_dish_unique UNIQUE (member_id, dish_id)
      );

      CREATE INDEX IF NOT EXISTS idx_members_group_id ON members(group_id);
      CREATE INDEX IF NOT EXISTS idx_dishes_group_id ON dishes(group_id);
      CREATE INDEX IF NOT EXISTS idx_likes_dish_id ON likes(dish_id);
      CREATE INDEX IF NOT EXISTS idx_dislikes_dish_id ON dislikes(dish_id);
    `);

    // Clean old obsolete prototype members
    await client.query(`
      DELETE FROM members 
      WHERE id IN ('member-rahul', 'member-priya', 'member-arjun', 'member-ananya') 
         OR name IN ('Rahul', 'Priya', 'Arjun', 'Ananya')
    `);

    // Check default group
    const groupCheck = await client.query('SELECT COUNT(*) FROM groups WHERE id = $1', ['group-our-meals']);
    const count = parseInt(groupCheck.rows[0].count, 10);

    if (count === 0) {
      const groupId = 'group-our-meals';
      await client.query(
        `INSERT INTO groups (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
        [groupId, 'Our Group']
      );

      const initialMembers = [
        { id: 'member-maneesh', name: 'Maneesh', avatarColor: 'bg-emerald-700' },
        { id: 'member-jinka', name: 'Jinka', avatarColor: 'bg-teal-700' },
        { id: 'member-vishwa', name: 'Vishwa', avatarColor: 'bg-amber-700' },
      ];

      for (const m of initialMembers) {
        await client.query(
          `INSERT INTO members (id, group_id, name, avatar_color) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
          [m.id, groupId, m.name, m.avatarColor]
        );
      }

      const initialDishes = [
        {
          id: 'dish-1',
          name: 'Paneer Butter Masala',
          suggestedBy: 'Maneesh',
          suggestedByMemberId: 'member-maneesh',
          likes: ['member-maneesh', 'member-jinka', 'member-vishwa'],
          dislikes: [],
        },
        {
          id: 'dish-2',
          name: 'Dosa',
          suggestedBy: 'Vishwa',
          suggestedByMemberId: 'member-vishwa',
          likes: ['member-vishwa', 'member-maneesh', 'member-jinka'],
          dislikes: [],
        },
        {
          id: 'dish-3',
          name: 'Dal Tadka',
          suggestedBy: 'Vishwa',
          suggestedByMemberId: 'member-vishwa',
          likes: ['member-vishwa', 'member-maneesh', 'member-jinka'],
          dislikes: [],
        },
        {
          id: 'dish-4',
          name: 'Idli',
          suggestedBy: 'Maneesh',
          suggestedByMemberId: 'member-maneesh',
          likes: ['member-maneesh', 'member-jinka'],
          dislikes: [],
        },
        {
          id: 'dish-5',
          name: 'Vegetable Biryani',
          suggestedBy: 'Jinka',
          suggestedByMemberId: 'member-jinka',
          likes: ['member-jinka', 'member-maneesh'],
          dislikes: [],
        },
        {
          id: 'dish-6',
          name: 'Upma',
          suggestedBy: 'Maneesh',
          suggestedByMemberId: 'member-maneesh',
          likes: ['member-maneesh'],
          dislikes: [],
        },
        {
          id: 'dish-7',
          name: 'Bitter Gourd Curry',
          suggestedBy: 'Jinka',
          suggestedByMemberId: 'member-jinka',
          likes: [],
          dislikes: ['member-maneesh'],
        },
        {
          id: 'dish-8',
          name: 'Brinjal Curry',
          suggestedBy: 'Maneesh',
          suggestedByMemberId: 'member-maneesh',
          likes: [],
          dislikes: ['member-vishwa', 'member-maneesh'],
        },
      ];

      for (const d of initialDishes) {
        await client.query(
          `INSERT INTO dishes (id, group_id, name, suggested_by, suggested_by_member_id)
           VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
          [d.id, groupId, d.name, d.suggestedBy, d.suggestedByMemberId]
        );

        for (const likerId of d.likes) {
          const likeId = `like-${likerId}-${d.id}`;
          await client.query(
            `INSERT INTO likes (id, member_id, dish_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
            [likeId, likerId, d.id]
          );
        }

        for (const dislikerId of d.dislikes) {
          const dislikeId = `dislike-${dislikerId}-${d.id}`;
          await client.query(
            `INSERT INTO dislikes (id, member_id, dish_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
            [dislikeId, dislikerId, d.id]
          );
        }
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

app.use(async (_req, _res, next) => {
  await ensureDbInit();
  next();
});

async function getFullBoard(groupId: string = 'group-our-meals') {
  let groupRes = await pool.query('SELECT * FROM groups WHERE id = $1', [groupId]);
  if (groupRes.rows.length === 0) {
    groupRes = await pool.query('SELECT * FROM groups LIMIT 1');
  }
  const groupRow = groupRes.rows[0];
  if (!groupRow) return null;
  const activeGroupId = groupRow.id;

  const membersRes = await pool.query(
    'SELECT * FROM members WHERE group_id = $1 ORDER BY created_at ASC',
    [activeGroupId]
  );

  const dishesRes = await pool.query(
    'SELECT * FROM dishes WHERE group_id = $1 ORDER BY created_at DESC',
    [activeGroupId]
  );

  const likesRes = await pool.query(
    `SELECT l.dish_id, l.member_id 
     FROM likes l 
     JOIN dishes d ON l.dish_id = d.id 
     WHERE d.group_id = $1`,
    [activeGroupId]
  );

  const dislikesRes = await pool.query(
    `SELECT dl.dish_id, dl.member_id 
     FROM dislikes dl 
     JOIN dishes d ON dl.dish_id = d.id 
     WHERE d.group_id = $1`,
    [activeGroupId]
  );

  const likesMap: Record<string, string[]> = {};
  for (const row of likesRes.rows) {
    if (!likesMap[row.dish_id]) likesMap[row.dish_id] = [];
    likesMap[row.dish_id].push(row.member_id);
  }

  const dislikesMap: Record<string, string[]> = {};
  for (const row of dislikesRes.rows) {
    if (!dislikesMap[row.dish_id]) dislikesMap[row.dish_id] = [];
    dislikesMap[row.dish_id].push(row.member_id);
  }

  return {
    group: {
      id: groupRow.id,
      name: groupRow.name,
      createdAt: groupRow.created_at,
    },
    members: membersRes.rows.map((m) => ({
      id: m.id,
      groupId: m.group_id,
      name: m.name,
      avatarColor: m.avatar_color,
      createdAt: m.created_at,
    })),
    dishes: dishesRes.rows.map((d) => ({
      id: d.id,
      groupId: d.group_id,
      name: d.name,
      suggestedBy: d.suggested_by,
      suggestedByMemberId: d.suggested_by_member_id,
      createdAt: d.created_at,
      likes: likesMap[d.id] || [],
      dislikes: dislikesMap[d.id] || [],
    })),
  };
}

const router = express.Router();

router.get('/board', async (req, res) => {
  try {
    const groupId = (req.query.groupId as string) || 'group-our-meals';
    const board = await getFullBoard(groupId);
    if (!board) return res.status(404).json({ error: 'Board not found' });
    res.json(board);
  } catch (err: any) {
    console.error('Error fetching board:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/dishes', async (req, res) => {
  try {
    const { groupId = 'group-our-meals', name, suggestedBy, suggestedByMemberId } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Dish name is required' });
    }

    const dishId = `dish-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const trimmedName = name.trim();

    await pool.query(
      `INSERT INTO dishes (id, group_id, name, suggested_by, suggested_by_member_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [dishId, groupId, trimmedName, suggestedBy || 'Anonymous', suggestedByMemberId || null]
    );

    if (suggestedByMemberId) {
      const likeId = `like-${suggestedByMemberId}-${dishId}`;
      await pool.query(
        `INSERT INTO likes (id, member_id, dish_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [likeId, suggestedByMemberId, dishId]
      );
    }

    const board = await getFullBoard(groupId);
    res.status(201).json(board);
  } catch (err: any) {
    console.error('Error creating dish:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/dishes/:id', async (req, res) => {
  try {
    const dishId = req.params.id;
    const groupId = (req.query.groupId as string) || 'group-our-meals';

    await pool.query('DELETE FROM dishes WHERE id = $1', [dishId]);

    const board = await getFullBoard(groupId);
    res.json(board);
  } catch (err: any) {
    console.error('Error deleting dish:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/dishes/:id/like', async (req, res) => {
  try {
    const dishId = req.params.id;
    const { memberId, groupId = 'group-our-meals' } = req.body;

    if (!memberId) return res.status(400).json({ error: 'memberId is required' });

    const existingLike = await pool.query(
      'SELECT id FROM likes WHERE member_id = $1 AND dish_id = $2',
      [memberId, dishId]
    );

    if (existingLike.rows.length > 0) {
      await pool.query('DELETE FROM likes WHERE member_id = $1 AND dish_id = $2', [memberId, dishId]);
    } else {
      await pool.query('DELETE FROM dislikes WHERE member_id = $1 AND dish_id = $2', [memberId, dishId]);
      const likeId = `like-${memberId}-${dishId}`;
      await pool.query(
        'INSERT INTO likes (id, member_id, dish_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [likeId, memberId, dishId]
      );
    }

    const board = await getFullBoard(groupId);
    res.json(board);
  } catch (err: any) {
    console.error('Error toggling like:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/dishes/:id/dislike', async (req, res) => {
  try {
    const dishId = req.params.id;
    const { memberId, groupId = 'group-our-meals' } = req.body;

    if (!memberId) return res.status(400).json({ error: 'memberId is required' });

    const existingDislike = await pool.query(
      'SELECT id FROM dislikes WHERE member_id = $1 AND dish_id = $2',
      [memberId, dishId]
    );

    if (existingDislike.rows.length > 0) {
      await pool.query('DELETE FROM dislikes WHERE member_id = $1 AND dish_id = $2', [memberId, dishId]);
    } else {
      await pool.query('DELETE FROM likes WHERE member_id = $1 AND dish_id = $2', [memberId, dishId]);
      const dislikeId = `dislike-${memberId}-${dishId}`;
      await pool.query(
        'INSERT INTO dislikes (id, member_id, dish_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [dislikeId, memberId, dishId]
      );
    }

    const board = await getFullBoard(groupId);
    res.json(board);
  } catch (err: any) {
    console.error('Error toggling dislike:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/members', async (req, res) => {
  try {
    const { groupId = 'group-our-meals', name, avatarColor } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Member name is required' });

    const memberId = `member-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await pool.query(
      `INSERT INTO members (id, group_id, name, avatar_color) VALUES ($1, $2, $3, $4)`,
      [memberId, groupId, name.trim(), avatarColor || 'bg-emerald-700']
    );

    const board = await getFullBoard(groupId);
    res.status(201).json(board);
  } catch (err: any) {
    console.error('Error adding member:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/members/:id', async (req, res) => {
  try {
    const memberId = req.params.id;
    const groupId = (req.query.groupId as string) || 'group-our-meals';

    await pool.query('DELETE FROM members WHERE id = $1', [memberId]);

    const board = await getFullBoard(groupId);
    res.json(board);
  } catch (err: any) {
    console.error('Error deleting member:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/ai/suggest', async (req, res) => {
  try {
    const { prompt, context, apiKey } = req.body;
    const suggestions = await suggestDishIdeas(
      prompt || 'Suggest 4-5 dish ideas',
      context || { existingDishes: [], popularLikes: [], dislikedDishes: [], members: [] },
      apiKey
    );
    res.json({ success: true, suggestions });
  } catch (err: any) {
    console.error('AI suggestion error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate dish suggestions' });
  }
});

app.use('/api', router);
app.use('/', router);

export default app;
