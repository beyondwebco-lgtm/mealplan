import { pool, initDb } from './db';

async function seedTestData() {
  console.log('Connecting to Neon PostgreSQL database...');
  await initDb();

  const client = await pool.connect();
  try {
    console.log('Clearing existing data...');
    await client.query('DELETE FROM members');
    await client.query('DELETE FROM groups');

    console.log('Inserting Test Group 1: Our Weekly Meals...');
    const group1Id = 'group-our-weekly-meals';
    const group1MealPlan = {
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
      [group1Id, 'Our Weekly Meals', 'Rahul', JSON.stringify(group1MealPlan)]
    );

    const membersGroup1 = [
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

    for (const m of membersGroup1) {
      await client.query(
        `INSERT INTO members (id, group_id, name, avatar_color, likes, dislikes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [m.id, group1Id, m.name, m.avatarColor, JSON.stringify(m.likes), JSON.stringify(m.dislikes)]
      );
    }

    console.log('Inserting Test Group 2: Flat 402 Roommates...');
    const group2Id = 'group-flat-402';
    const group2MealPlan = {
      monday: { breakfast: 'Oatmeal & Fruits', lunch: 'Veg Fried Rice', dinner: 'Paneer Tikka + Roti' },
      tuesday: { breakfast: 'Toast & Eggs', lunch: 'Rajma Chawal', dinner: 'Yellow Dal + Rice' },
      wednesday: { breakfast: 'Poha', lunch: 'Chole Bhature', dinner: 'Khichdi' },
      thursday: { breakfast: 'Dosa', lunch: 'Veg Pulao', dinner: 'Palak Paneer + Roti' },
      friday: { breakfast: 'Smoothie Bowl', lunch: 'Sambar Rice', dinner: 'Pizza Night' },
      saturday: { breakfast: 'Pancakes', lunch: 'Pasta Arrabiata', dinner: 'Biryani' },
      sunday: { breakfast: 'Aloo Paratha', lunch: 'Special Thali', dinner: 'Light Soup & Toast' },
    };

    await client.query(
      `INSERT INTO groups (id, name, creator_name, meal_plan) VALUES ($1, $2, $3, $4)`,
      [group2Id, 'Flat 402 Roommates', 'Kavita', JSON.stringify(group2MealPlan)]
    );

    const membersGroup2 = [
      {
        id: 'member-kavita',
        name: 'Kavita',
        avatarColor: 'bg-indigo-700',
        likes: ['Paneer Tikka', 'Palak Paneer', 'Rajma Chawal', 'Dosa'],
        dislikes: ['Bitter Gourd', 'Mushroom Curry'],
      },
      {
        id: 'member-rohit',
        name: 'Rohit',
        avatarColor: 'bg-cyan-700',
        likes: ['Rajma Chawal', 'Paneer Tikka', 'Biryani'],
        dislikes: ['Karela', 'Capsicum Curry'],
      },
    ];

    for (const m of membersGroup2) {
      await client.query(
        `INSERT INTO members (id, group_id, name, avatar_color, likes, dislikes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [m.id, group2Id, m.name, m.avatarColor, JSON.stringify(m.likes), JSON.stringify(m.dislikes)]
      );
    }

    console.log('\n--- VERIFYING INSERTED DATA FROM POSTGRESQL ---');
    const groupsRes = await client.query('SELECT id, name, creator_name FROM groups ORDER BY created_at ASC');
    console.log(`Total Groups in Database: ${groupsRes.rows.length}`);
    for (const g of groupsRes.rows) {
      const membersRes = await client.query('SELECT name, likes, dislikes FROM members WHERE group_id = $1', [g.id]);
      console.log(`\nGroup: "${g.name}" (Creator: ${g.creator_name})`);
      console.log(`Members count: ${membersRes.rows.length}`);
      membersRes.rows.forEach((m) => {
        const lks = typeof m.likes === 'string' ? JSON.parse(m.likes) : m.likes;
        const dlks = typeof m.dislikes === 'string' ? JSON.parse(m.dislikes) : m.dislikes;
        console.log(`  - ${m.name}: ${lks.length} likes (${lks.join(', ')}), ${dlks.length} dislikes (${dlks.join(', ')})`);
      });
    }

    console.log('\n✅ Database test data seeding completed successfully!');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedTestData();
