import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { getPrismaClient } from '@/lib/db/prisma';

const prisma = getPrismaClient();

const MOCK_USERS = [
  {
    username: 'arjun.me',
    email: 'arjun@phryvos.com',
    displayName: 'Arjun',
    bio: 'Gamer | Python developer | Cricket fan 🏏',
    avatar: '🎮',
    interests: ['Gaming', 'Coding', 'Cricket', 'Anime'],
    location: 'Mumbai, India',
  },
  {
    username: 'sarah.travels',
    email: 'sarah@phryvos.com',
    displayName: 'Sarah',
    bio: 'Wanderlust soul 🌍 | Photography | Coffee addict',
    avatar: '🌸',
    interests: ['Travel', 'Photography', 'Coffee', 'Books'],
    location: 'London, UK',
  },
  {
    username: 'kenji.dev',
    email: 'kenji@phryvos.com',
    displayName: 'Kenji',
    bio: 'Full-stack dev | Rust & Go | Anime lover',
    avatar: '⚡',
    interests: ['Coding', 'Anime', 'Gaming', 'Music'],
    location: 'Tokyo, Japan',
  },
  {
    username: 'maya.creates',
    email: 'maya@phryvos.com',
    displayName: 'Maya',
    bio: 'Digital artist 🎨 | Illustrator | Cat mom',
    avatar: '🎨',
    interests: ['Art', 'Animals', 'Music', 'Games'],
    location: 'Berlin, Germany',
  },
  {
    username: 'carlos.music',
    email: 'carlos@phryvos.com',
    displayName: 'Carlos',
    bio: 'Music producer 🎵 | Beats | Salsa dancer',
    avatar: '🎵',
    interests: ['Music', 'Dancing', 'Travel', 'Food'],
    location: 'São Paulo, Brazil',
  },
  {
    username: 'priya.codes',
    email: 'priya@phryvos.com',
    displayName: 'Priya',
    bio: 'Software engineer @ Google | AI enthusiast',
    avatar: '💻',
    interests: ['Coding', 'AI', 'Books', 'Travel'],
    location: 'Bangalore, India',
  },
  {
    username: 'alex.games',
    email: 'alex@phryvos.com',
    displayName: 'Alex',
    bio: 'Pro gamer 🏆 | Streaming | Valorant player',
    avatar: '🔥',
    interests: ['Gaming', 'Streaming', 'Tech', 'Anime'],
    location: 'Los Angeles, USA',
  },
  {
    username: 'luna.art',
    email: 'luna@phryvos.com',
    displayName: 'Luna',
    bio: 'Fashion designer 👗 | Seoul | K-drama fan',
    avatar: '🌙',
    interests: ['Fashion', 'Art', 'K-Drama', 'Food'],
    location: 'Seoul, South Korea',
  },
];

const POST_CONTENTS = [
  { content: 'Just finished building a new feature for Phryvos! The radar matching algorithm is now 3x faster 🚀', vibe: 'Tech Update', tags: ['#coding', '#phryvos', '#backend'] },
  { content: 'Late night coding sessions hit different. Currently working on the real-time chat SSE implementation.', vibe: 'Midnight Epiphany', tags: ['#coding', '#nightowl', '#sse'] },
  { content: 'Met someone amazing on radar today from Tokyo! We talked about Rust for 3 hours 🦀', vibe: 'Stranger Encounter', tags: ['#radar', '#meetup', '#rust'] },
  { content: 'Rainy day vibes ☔ Perfect time to refactor the safety engine. Rate limiting + profanity filtering = cleaner chats.', vibe: 'Rainy Reflection', tags: ['#safety', '#refactor', '#typescript'] },
  { content: "Question for the community: What's your favorite Phryvos feature so far? Radar? Chat? Feed?", vibe: 'Life Dilemma', tags: ['#community', '#feedback', '#features'] },
];

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.block.deleteMany();
  await prisma.report.deleteMany();
  await prisma.connection.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.story.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  // Hash password
  const passwordHash = await bcrypt.hash('password123', 12);

  // Create users
  const users = [];
  for (const u of MOCK_USERS) {
    const user = await prisma.user.create({
      data: {
        username: u.username,
        email: u.email,
        passwordHash,
        displayName: u.displayName,
        bio: u.bio,
        avatar: u.avatar,
        interests: u.interests,
        location: u.location,
        isOnline: true,
        followers: Math.floor(Math.random() * 5000),
        following: Math.floor(Math.random() * 1000),
        postsCount: Math.floor(Math.random() * 50),
      },
    });
    users.push(user);
    console.log(`✅ Created user: ${user.displayName} (@${user.username})`);
  }

  // Create posts
  for (let i = 0; i < POST_CONTENTS.length; i++) {
    const author = users[Math.floor(Math.random() * users.length)];
    const pc = POST_CONTENTS[i];
    await prisma.post.create({
      data: {
        authorId: author.id,
        content: pc.content,
        vibe: pc.vibe,
        tags: pc.tags,
        format: 'STANDARD',
        likesCount: Math.floor(Math.random() * 500),
        commentsCount: Math.floor(Math.random() * 50),
        shares: Math.floor(Math.random() * 20),
      },
    });
    console.log(`✅ Created post by ${author.displayName}`);
  }

  // Create some connections
  for (let i = 0; i < users.length - 1; i++) {
    await prisma.connection.create({
      data: {
        userId: users[i].id,
        connectedUserId: users[i + 1].id,
        connectedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        lastMessage: 'Hey! Great to connect!',
        lastMessageAt: new Date(),
      },
    });
  }

  // Create conversations and messages
  for (let i = 0; i < 3; i++) {
    const conv = await prisma.conversation.create({ data: {} });
    const p1 = users[i];
    const p2 = users[(i + 1) % users.length];

    await prisma.conversationParticipant.createMany({
      data: [
        { conversationId: conv.id, userId: p1.id },
        { conversationId: conv.id, userId: p2.id },
      ],
    });

    await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: p1.id,
        receiverId: p2.id,
        content: 'Hey! Thanks for connecting on Phryvos 👋',
        type: 'TEXT',
      },
    });
    await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: p2.id,
        receiverId: p1.id,
        content: "Same here! How's your day going?",
        type: 'TEXT',
      },
    });
  }

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });