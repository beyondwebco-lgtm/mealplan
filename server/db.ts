import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import dotenv from 'dotenv';
import path from 'path';
import * as schema from './schema';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not defined in environment variables.');
}

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const db = drizzle(pool, { schema });

export async function initDb() {
  const client = await pool.connect();
  try {
    // 1. Create tables
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

    // 2. Clean obsolete names from old prototype
    await client.query(`
      DELETE FROM members 
      WHERE id IN ('member-rahul', 'member-priya', 'member-arjun', 'member-ananya') 
         OR name IN ('Rahul', 'Priya', 'Arjun', 'Ananya')
    `);

    // 3. Check and seed default group "Our Group"
    const groupCheck = await client.query('SELECT COUNT(*) FROM groups WHERE id = $1', ['group-our-meals']);
    const count = parseInt(groupCheck.rows[0].count, 10);

    if (count === 0) {
      console.log('Seeding initial MealTogether data into PostgreSQL...');
      const groupId = 'group-our-meals';

      await client.query(
        `INSERT INTO groups (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
        [groupId, 'Our Group']
      );

      // Members
      const initialMembers = [
        { id: 'member-jinka', name: 'Jinka', avatarColor: 'bg-emerald-700' },
        { id: 'member-arun', name: 'Arun', avatarColor: 'bg-teal-700' },
        { id: 'member-maneesh', name: 'Maneesh', avatarColor: 'bg-stone-700' },
        { id: 'member-vishwa', name: 'Vishwa', avatarColor: 'bg-amber-700' },
        { id: 'member-saipavan', name: 'Sai Pavan', avatarColor: 'bg-indigo-700' },
        { id: 'member-tata', name: 'Tata', avatarColor: 'bg-rose-700' },
        { id: 'member-indra', name: 'Indra', avatarColor: 'bg-blue-700' },
      ];

      for (const m of initialMembers) {
        await client.query(
          `INSERT INTO members (id, group_id, name, avatar_color) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
          [m.id, groupId, m.name, m.avatarColor]
        );
      }

      // Dishes
      const initialDishes = [
        {
          id: 'dish-1',
          name: 'Dosa',
          suggestedBy: 'Jinka',
          suggestedByMemberId: 'member-jinka',
          likes: ['member-jinka', 'member-arun', 'member-maneesh', 'member-vishwa', 'member-saipavan', 'member-indra'],
          dislikes: [],
        },
        {
          id: 'dish-2',
          name: 'Paneer Butter Masala',
          suggestedBy: 'Maneesh',
          suggestedByMemberId: 'member-maneesh',
          likes: ['member-maneesh', 'member-jinka', 'member-arun', 'member-indra', 'member-saipavan'],
          dislikes: [],
        },
        {
          id: 'dish-3',
          name: 'Dal Tadka',
          suggestedBy: 'Arun',
          suggestedByMemberId: 'member-arun',
          likes: ['member-arun', 'member-jinka', 'member-maneesh', 'member-vishwa', 'member-tata'],
          dislikes: [],
        },
        {
          id: 'dish-4',
          name: 'Idli',
          suggestedBy: 'Sai Pavan',
          suggestedByMemberId: 'member-saipavan',
          likes: ['member-saipavan', 'member-jinka', 'member-arun', 'member-indra'],
          dislikes: [],
        },
        {
          id: 'dish-5',
          name: 'Upma',
          suggestedBy: 'Vishwa',
          suggestedByMemberId: 'member-vishwa',
          likes: ['member-vishwa', 'member-tata', 'member-maneesh'],
          dislikes: ['member-indra'],
        },
        {
          id: 'dish-6',
          name: 'Bitter Gourd Curry',
          suggestedBy: 'Tata',
          suggestedByMemberId: 'member-tata',
          likes: ['member-tata'],
          dislikes: ['member-maneesh', 'member-arun', 'member-jinka', 'member-saipavan'],
        },
        {
          id: 'dish-7',
          name: 'Brinjal Curry',
          suggestedBy: 'Maneesh',
          suggestedByMemberId: 'member-maneesh',
          likes: ['member-maneesh'],
          dislikes: ['member-vishwa', 'member-arun', 'member-indra'],
        },
        {
          id: 'dish-8',
          name: 'Fish Curry',
          suggestedBy: 'Indra',
          suggestedByMemberId: 'member-indra',
          likes: ['member-indra', 'member-vishwa'],
          dislikes: ['member-jinka', 'member-tata'],
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

      console.log('Seeded MealTogether successfully with Jinka, Arun, Maneesh, Vishwa, Sai Pavan, Tata, Indra!');
    }
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  } finally {
    client.release();
  }
}
