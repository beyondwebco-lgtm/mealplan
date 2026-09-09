import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not defined in environment variables.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function resetDatabase() {
  console.log('Connecting to Neon PostgreSQL database...');
  const client = await pool.connect();

  try {
    console.log('Adjusting column constraints for seamless compatibility...');
    // Drop NOT NULL on legacy unused columns and add safe defaults
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='groups' AND column_name='creator_name') THEN
          ALTER TABLE groups ALTER COLUMN creator_name DROP NOT NULL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='groups' AND column_name='meal_plan') THEN
          ALTER TABLE groups ALTER COLUMN meal_plan DROP NOT NULL;
          ALTER TABLE groups ALTER COLUMN meal_plan SET DEFAULT '{}'::jsonb;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='likes') THEN
          ALTER TABLE members ALTER COLUMN likes DROP NOT NULL;
          ALTER TABLE members ALTER COLUMN likes SET DEFAULT '[]'::jsonb;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='members' AND column_name='dislikes') THEN
          ALTER TABLE members ALTER COLUMN dislikes DROP NOT NULL;
          ALTER TABLE members ALTER COLUMN dislikes SET DEFAULT '[]'::jsonb;
        END IF;
      END $$;
    `);

    // Begin transaction for complete atomic wipe & clean seeding
    await client.query('BEGIN');

    console.log('1. Deleting all existing data in foreign-key safe order...');
    await client.query('DELETE FROM dislikes;');
    await client.query('DELETE FROM likes;');
    await client.query('DELETE FROM dishes;');
    await client.query('DELETE FROM members;');
    await client.query('DELETE FROM groups;');

    console.log('2. Inserting exactly 1 group: "MealTogether"...');
    const groupId = 'group-mealtogether';
    const groupName = 'MealTogether';

    await client.query(
      `INSERT INTO groups (id, name, created_at) VALUES ($1, $2, NOW())`,
      [groupId, groupName]
    );

    console.log('3. Inserting exactly 7 members...');
    const members = [
      { id: 'member-jinka', name: 'Jinka', avatarColor: 'bg-emerald-700' },
      { id: 'member-arun', name: 'Arun', avatarColor: 'bg-teal-700' },
      { id: 'member-maneesh', name: 'Maneesh', avatarColor: 'bg-stone-700' },
      { id: 'member-vishwa', name: 'Vishwa', avatarColor: 'bg-amber-700' },
      { id: 'member-saipavan', name: 'Sai Pavan', avatarColor: 'bg-indigo-700' },
      { id: 'member-tata', name: 'Tata', avatarColor: 'bg-rose-700' },
      { id: 'member-indra', name: 'Indra', avatarColor: 'bg-blue-700' },
    ];

    for (const m of members) {
      await client.query(
        `INSERT INTO members (id, group_id, name, avatar_color, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [m.id, groupId, m.name, m.avatarColor]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Database transaction committed successfully.');

    console.log('\n================ DATABASE VERIFICATION ================');
    const groupsRes = await client.query('SELECT id, name, created_at FROM groups');
    const membersRes = await client.query('SELECT id, name, avatar_color, group_id FROM members ORDER BY created_at ASC');
    const dishesRes = await client.query('SELECT * FROM dishes');
    const likesRes = await client.query('SELECT * FROM likes');
    const dislikesRes = await client.query('SELECT * FROM dislikes');

    console.log(`Groups Count:    ${groupsRes.rows.length} (Expected: 1)`);
    console.log(`Members Count:   ${membersRes.rows.length} (Expected: 7)`);
    console.log(`Dishes Count:    ${dishesRes.rows.length} (Expected: 0)`);
    console.log(`Likes Count:     ${likesRes.rows.length} (Expected: 0)`);
    console.log(`Dislikes Count:  ${dislikesRes.rows.length} (Expected: 0)`);

    console.log('\nGroup in DB:');
    groupsRes.rows.forEach((g) => console.log(`  - [${g.id}] "${g.name}"`));

    console.log('\nMembers in DB:');
    membersRes.rows.forEach((m, idx) => console.log(`  ${idx + 1}. [${m.id}] ${m.name} (${m.avatar_color}) -> Group: ${m.group_id}`));

    console.log('\nDishes in DB:');
    console.log(`  Total Dishes: ${dishesRes.rows.length}`);

    console.log('=======================================================\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during database reset:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

resetDatabase().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
