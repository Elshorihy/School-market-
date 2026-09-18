import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid
} from 'drizzle-orm/pg-core';

/* ------------------------------------------------------------------ */
/* Geography                                                           */
/* ------------------------------------------------------------------ */

export const governorates = pgTable('governorates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  sort: integer('sort').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const areas = pgTable(
  'areas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    governorateId: uuid('governorate_id')
      .notNull()
      .references(() => governorates.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    unique('areas_name_govt').on(t.name, t.governorateId),
    index('areas_governorate_idx').on(t.governorateId)
  ]
);

export const schools = pgTable(
  'schools',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    areaId: uuid('area_id')
      .notNull()
      .references(() => areas.id, { onDelete: 'cascade' }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    unique('schools_name_area').on(t.name, t.areaId),
    index('schools_area_idx').on(t.areaId)
  ]
);

/* ------------------------------------------------------------------ */
/* Identity & sessions                                                 */
/* ------------------------------------------------------------------ */

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    role: text('role', { enum: ['student', 'admin'] }).notNull().default('student'),
    status: text('status', { enum: ['active', 'suspended'] }).notNull().default('active'),
    governorateId: uuid('governorate_id').references(() => governorates.id, {
      onDelete: 'set null'
    }),
    areaId: uuid('area_id').references(() => areas.id, { onDelete: 'set null' }),
    schoolId: uuid('school_id').references(() => schools.id, { onDelete: 'set null' }),
    bio: text('bio'),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [index('users_governorate_idx').on(t.governorateId)]
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    userAgent: text('user_agent'),
    ip: text('ip'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [index('sessions_user_idx').on(t.userId)]
);

export const blocks = pgTable(
  'blocks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    blockerId: uuid('blocker_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    blockedId: uuid('blocked_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [unique('blocks_pair').on(t.blockerId, t.blockedId)]
);

/* ------------------------------------------------------------------ */
/* Marketplace                                                         */
/* ------------------------------------------------------------------ */

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  icon: text('icon'),
  isActive: boolean('is_active').notNull().default(true),
  sort: integer('sort').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const listings = pgTable(
  'listings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type', { enum: ['sale', 'exchange', 'free'] }).notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    price: text('price'), // stored as string decimal; null for free
    categoryId: uuid('category_id').references(() => categories.id, {
      onDelete: 'set null'
    }),
    governorateId: uuid('governorate_id').references(() => governorates.id, {
      onDelete: 'set null'
    }),
    areaId: uuid('area_id').references(() => areas.id, { onDelete: 'set null' }),
    schoolId: uuid('school_id').references(() => schools.id, { onDelete: 'set null' }),
    condition: text('condition', {
      enum: ['new', 'like-new', 'good', 'used', 'damaged']
    }).notNull(),
    status: text('status', {
      enum: ['active', 'sold', 'exchanged', 'closed', 'pending', 'removed']
    }).notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    index('listings_status_created_idx').on(t.status, t.createdAt),
    index('listings_user_idx').on(t.userId),
    index('listings_category_idx').on(t.categoryId),
    index('listings_governorate_idx').on(t.governorateId),
    index('listings_area_idx').on(t.areaId),
    index('listings_school_idx').on(t.schoolId),
    index('listings_type_idx').on(t.type)
  ]
);

export const listingImages = pgTable(
  'listing_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    position: integer('position').notNull().default(0)
  },
  (t) => [index('listing_images_listing_idx').on(t.listingId)]
);

export const favorites = pgTable(
  'favorites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [unique('favorites_user_listing').on(t.userId, t.listingId)]
);

/* ------------------------------------------------------------------ */
/* Messaging                                                           */
/* ------------------------------------------------------------------ */

/**
 * 1:1 conversations. The two user ids are stored normalized (userIdA < userIdB)
 * so the unique constraint guarantees a single conversation per pair and
 * makes "find conversation with user X" a single indexed lookup.
 */
export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userIdA: uuid('user_a')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    userIdB: uuid('user_b')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    unique('conversations_pair').on(t.userIdA, t.userIdB),
    index('conversations_a_idx').on(t.userIdA),
    index('conversations_b_idx').on(t.userIdB)
  ]
);

export const conversationParticipants = pgTable(
  'conversation_participants',
  {
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [primaryKey({ columns: [t.conversationId, t.userId] })]
);

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [index('messages_conversation_idx').on(t.conversationId, t.createdAt)]
);

/* ------------------------------------------------------------------ */
/* Wanted items ("مطلوب")                                              */
/* ------------------------------------------------------------------ */

export const wantedItems = pgTable(
  'wanted_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    categoryId: uuid('category_id').references(() => categories.id, {
      onDelete: 'set null'
    }),
    governorateId: uuid('governorate_id').references(() => governorates.id, {
      onDelete: 'set null'
    }),
    areaId: uuid('area_id').references(() => areas.id, { onDelete: 'set null' }),
    schoolId: uuid('school_id').references(() => schools.id, { onDelete: 'set null' }),
    status: text('status', { enum: ['open', 'found', 'closed'] }).notNull().default('open'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    index('wanted_user_idx').on(t.userId),
    index('wanted_status_idx').on(t.status),
    index('wanted_category_idx').on(t.categoryId)
  ]
);

/* ------------------------------------------------------------------ */
/* Moderation & notifications                                          */
/* ------------------------------------------------------------------ */

export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reporterId: uuid('reporter_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    targetType: text('target_type', { enum: ['listing', 'user', 'message'] }).notNull(),
    targetId: uuid('target_id').notNull(),
    reason: text('reason').notNull(),
    details: text('details'),
    status: text('status', {
      enum: ['open', 'resolved', 'dismissed']
    }).notNull().default('open'),
    adminNote: text('admin_note'),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [
    index('reports_status_idx').on(t.status),
    index('reports_target_idx').on(t.targetType, t.targetId)
  ]
);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type', {
      enum: [
        'message',
        'favorite',
        'match',
        'listing_status',
        'moderation',
        'report',
        'system'
      ]
    }).notNull().default('system'),
    title: text('title').notNull(),
    body: text('body').notNull(),
    link: text('link'),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [index('notifications_user_idx').on(t.userId, t.createdAt)]
);
