import express from 'express';
import cors from 'cors';
import { pool, initDb } from './db';
import { suggestDishIdeas } from './ai';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper to fetch full board state for a group
async function getFullBoard(groupId: string = 'group-our-meals') {
  // 1. Get Group
  let groupRes = await pool.query('SELECT * FROM groups WHERE id = $1', [groupId]);
  if (groupRes.rows.length === 0) {
    // Default group fallback
    groupRes = await pool.query('SELECT * FROM groups LIMIT 1');
  }
  const groupRow = groupRes.rows[0];
  if (!groupRow) return null;
  const activeGroupId = groupRow.id;

  // 2. Get Members
  const membersRes = await pool.query(
    'SELECT * FROM members WHERE group_id = $1 ORDER BY created_at ASC',
    [activeGroupId]
  );

  // 3. Get Dishes
  const dishesRes = await pool.query(
    'SELECT * FROM dishes WHERE group_id = $1 ORDER BY created_at DESC',
    [activeGroupId]
  );

  // 4. Get Likes & Dislikes for this group's dishes
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

// GET full board (group, members, dishes with likes & dislikes)
app.get('/api/board', async (req, res) => {
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

// POST add dish idea
app.post('/api/dishes', async (req, res) => {
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

    // If suggestedByMemberId provided, auto-like the dish they suggested
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

// DELETE dish idea
app.delete('/api/dishes/:id', async (req, res) => {
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

// POST toggle Like on a dish
app.post('/api/dishes/:id/like', async (req, res) => {
  try {
    const dishId = req.params.id;
    const { memberId, groupId = 'group-our-meals' } = req.body;

    if (!memberId) return res.status(400).json({ error: 'memberId is required' });

    // Check if like currently exists
    const existingLike = await pool.query(
      'SELECT id FROM likes WHERE member_id = $1 AND dish_id = $2',
      [memberId, dishId]
    );

    if (existingLike.rows.length > 0) {
      // Toggle off Like
      await pool.query('DELETE FROM likes WHERE member_id = $1 AND dish_id = $2', [memberId, dishId]);
    } else {
      // Remove any dislike first
      await pool.query('DELETE FROM dislikes WHERE member_id = $1 AND dish_id = $2', [memberId, dishId]);
      // Add Like
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

// POST toggle Dislike on a dish
app.post('/api/dishes/:id/dislike', async (req, res) => {
  try {
    const dishId = req.params.id;
    const { memberId, groupId = 'group-our-meals' } = req.body;

    if (!memberId) return res.status(400).json({ error: 'memberId is required' });

    // Check if dislike currently exists
    const existingDislike = await pool.query(
      'SELECT id FROM dislikes WHERE member_id = $1 AND dish_id = $2',
      [memberId, dishId]
    );

    if (existingDislike.rows.length > 0) {
      // Toggle off Dislike
      await pool.query('DELETE FROM dislikes WHERE member_id = $1 AND dish_id = $2', [memberId, dishId]);
    } else {
      // Remove any like first
      await pool.query('DELETE FROM likes WHERE member_id = $1 AND dish_id = $2', [memberId, dishId]);
      // Add Dislike
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

// POST add new member
app.post('/api/members', async (req, res) => {
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

// DELETE member
app.delete('/api/members/:id', async (req, res) => {
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

// POST simple AI suggestion helper
app.post('/api/ai/suggest', async (req, res) => {
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

// Start Express server after DB init
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 MealTogether server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server due to DB error:', err);
  });
