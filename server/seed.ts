import { pool, initDb } from './db';

async function seedData() {
  console.log('Connecting to Neon PostgreSQL database...');
  await initDb();

  const client = await pool.connect();
  try {
    console.log('Clearing existing data...');
    await client.query('DELETE FROM dislikes');
    await client.query('DELETE FROM likes');
    await client.query('DELETE FROM dishes');
    await client.query('DELETE FROM members');
    await client.query('DELETE FROM groups');

    console.log('Inserting group: MealTogether...');
    const groupId = 'group-mealtogether';
    await client.query(
      `INSERT INTO groups (id, name, created_at) VALUES ($1, $2, NOW())`,
      [groupId, 'MealTogether']
    );

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

    console.log('Verifying data in PostgreSQL...');
    const groupsRes = await client.query('SELECT * FROM groups');
    const membersRes = await client.query('SELECT id, name, avatar_color FROM members');
    const dishesRes = await client.query('SELECT * FROM dishes');

    console.log(`Groups in DB: ${groupsRes.rows.length}`);
    console.log(`Members in DB: ${membersRes.rows.length}`);
    console.log(`Dishes in DB: ${dishesRes.rows.length}`);
    console.log('✅ Clean initial state established successfully!');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedData();
