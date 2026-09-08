import { pgTable, varchar, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const groups = pgTable('groups', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const members = pgTable('members', {
  id: varchar('id', { length: 255 }).primaryKey(),
  groupId: varchar('group_id', { length: 255 }).notNull().references(() => groups.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  avatarColor: varchar('avatar_color', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const dishes = pgTable('dishes', {
  id: varchar('id', { length: 255 }).primaryKey(),
  groupId: varchar('group_id', { length: 255 }).notNull().references(() => groups.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  suggestedBy: varchar('suggested_by', { length: 255 }).notNull(),
  suggestedByMemberId: varchar('suggested_by_member_id', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const likes = pgTable('likes', {
  id: varchar('id', { length: 255 }).primaryKey(),
  memberId: varchar('member_id', { length: 255 }).notNull().references(() => members.id, { onDelete: 'cascade' }),
  dishId: varchar('dish_id', { length: 255 }).notNull().references(() => dishes.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  memberDishIdx: uniqueIndex('likes_member_dish_idx').on(table.memberId, table.dishId),
}));

export const dislikes = pgTable('dislikes', {
  id: varchar('id', { length: 255 }).primaryKey(),
  memberId: varchar('member_id', { length: 255 }).notNull().references(() => members.id, { onDelete: 'cascade' }),
  dishId: varchar('dish_id', { length: 255 }).notNull().references(() => dishes.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  memberDishIdx: uniqueIndex('dislikes_member_dish_idx').on(table.memberId, table.dishId),
}));
