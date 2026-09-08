import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

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

export async function initDb() {
  const client = await pool.connect();
  try {
    // Create tables
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

    // Seed sample group if empty
    // Clean up any old obsolete sample members from database
    await client.query(`DELETE FROM members WHERE id IN ('member-rahul', 'member-priya', 'member-arjun', 'member-ananya') OR name IN ('Rahul', 'Priya', 'Arjun', 'Ananya')`);
    await client.query(`UPDATE groups SET creator_name = 'Maneesh' WHERE creator_name = 'Rahul'`);

    const checkRes = await client.query('SELECT COUNT(*) FROM groups');
    const count = parseInt(checkRes.rows[0].count, 10);
    if (count === 0) {
      console.log('Seeding initial sample data into PostgreSQL...');
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
        [sampleGroupId, 'Our Weekly Meals', 'Maneesh', JSON.stringify(sampleMealPlan)]
      );

      const sampleMembers = [
        {
          id: 'member-maneesh',
          name: 'Maneesh',
          avatarColor: 'bg-emerald-700',
          likes: ['Paneer Butter Masala', 'Dal Tadka', 'Vegetable Biryani', 'Roti'],
          dislikes: ['Bitter Gourd Curry'],
        },
        {
          id: 'member-jinka',
          name: 'Jinka',
          avatarColor: 'bg-teal-700',
          likes: ['Dal Tadka', 'Paneer Butter Masala', 'Chapati', 'Aloo Curry'],
          dislikes: ['Fish Curry'],
        },
        {
          id: 'member-vishwa',
          name: 'Vishwa',
          avatarColor: 'bg-amber-700',
          likes: ['Chicken Curry', 'Vegetable Biryani', 'Dal Tadka', 'Dosa with Chutney'],
          dislikes: ['Brinjal Curry'],
        },
      ];

      for (const m of sampleMembers) {
        await pool.query(
          `INSERT INTO members (id, group_id, name, avatar_color, likes, dislikes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [m.id, sampleGroupId, m.name, m.avatarColor, JSON.stringify(m.likes), JSON.stringify(m.dislikes)]
        );
      }
      console.log('Seeded database successfully with Maneesh, Jinka, Vishwa!');
    }
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  } finally {
    client.release();
  }
}
