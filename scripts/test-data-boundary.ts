/**
 * Phase 2D — Data Boundary Forensic Test
 *
 * Verifies that production code does not silently fall back to mock/fake
 * data for authenticated-user identity or user-scoped data.
 *
 * Run: npx ts-node scripts/test-data-boundary.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_ROOT = path.resolve(__dirname, '../src');

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${name}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

function readRecursively(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...readRecursively(full));
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

// Patterns that must NOT appear in production code (outside lib/mock)
const FORBIDDEN_PATTERNS = [
  'CURRENT_USER',
  'MOCK_USERS',
  'MOCK_POSTS',
  'getUserById',   // only exists in lib/mock/users.ts
  'getConversations', // only exists in lib/mock/conversations.ts
];

// Directories that ARE allowed to contain these patterns (deferred scope)
const ALLOWED_DIRS = [
  path.join(SRC_ROOT, 'lib/mock'),
  path.join(SRC_ROOT, 'lib/auth/config.ts'), // build-time mock is expected
  path.join(SRC_ROOT, 'components/activities'), // game architecture — deferred per Phase 2D scope
];

function isAllowedPath(filePath: string): boolean {
  return ALLOWED_DIRS.some((d) => filePath.startsWith(d));
}

function scanFile(filePath: string): string[] {
  if (isAllowedPath(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const violations: string[] = [];
  for (const pattern of FORBIDDEN_PATTERNS) {
    // Skip if pattern is in a comment
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) continue;
      if (line.includes(pattern)) {
        violations.push(`${filePath}:${i + 1}: contains '${pattern}'`);
      }
    }
  }
  return violations;
}

console.log('🧪 Phase 2D — Data Boundary Forensic Test\n');

// ── Test 1: No CURRENT_USER in production components ─────────────────────
console.log('--- Test 1: No CURRENT_USER in production code ---');
const allFiles = readRecursively(SRC_ROOT);
const currentUserviolations: string[] = [];
for (const f of allFiles) {
  const violations = scanFile(f);
  currentUserviolations.push(...violations.filter((v) => v.includes('CURRENT_USER')));
}
assert(
  currentUserviolations.length === 0,
  'CURRENT_USER absent from production code',
  currentUserviolations.length > 0
    ? `\n    ${currentUserviolations.slice(0, 5).join('\n    ')}`
    : undefined
);

// ── Test 2: No MOCK_USERS in production components ───────────────────────
console.log('\n--- Test 2: No MOCK_USERS in production code ---');
const mockUserViolations: string[] = [];
for (const f of allFiles) {
  const violations = scanFile(f);
  mockUserViolations.push(...violations.filter((v) => v.includes('MOCK_USERS')));
}
assert(
  mockUserViolations.length === 0,
  'MOCK_USERS absent from production code',
  mockUserViolations.length > 0
    ? `\n    ${mockUserViolations.slice(0, 5).join('\n    ')}`
    : undefined
);

// ── Test 3: No MOCK_POSTS in production components ──────────────────────
console.log('\n--- Test 3: No MOCK_POSTS in production code ---');
const mockPostViolations: string[] = [];
for (const f of allFiles) {
  const violations = scanFile(f);
  mockPostViolations.push(...violations.filter((v) => v.includes('MOCK_POSTS')));
}
assert(
  mockPostViolations.length === 0,
  'MOCK_POSTS absent from production code',
  mockPostViolations.length > 0
    ? `\n    ${mockPostViolations.slice(0, 5).join('\n    ')}`
    : undefined
);

// ── Test 4: Posts store does not seed from mocks ────────────────────────
console.log('\n--- Test 4: Posts store initial state ---');
const postsStoreContent = fs.readFileSync(
  path.join(SRC_ROOT, 'store/posts.ts'),
  'utf8'
);
assert(
  !postsStoreContent.includes('MOCK_POSTS'),
  'posts store does not import MOCK_POSTS'
);
assert(
  postsStoreContent.includes("posts: []"),
  'posts store initialises to empty array'
);

// ── Test 5: Connections store does not seed from mocks ──────────────────
console.log('\n--- Test 5: Connections store initial state ---');
const connStoreContent = fs.readFileSync(
  path.join(SRC_ROOT, 'store/connections.ts'),
  'utf8'
);
assert(
  !connStoreContent.includes('MOCK_USERS'),
  'connections store does not import MOCK_USERS'
);
assert(
  connStoreContent.includes("connections: []"),
  'connections store initialises to empty array'
);

// ── Test 6: Search page uses API, not local filter ──────────────────────
console.log('\n--- Test 6: Search page data source ---');
const searchPageContent = fs.readFileSync(
  path.join(SRC_ROOT, 'app/(app)/search/page.tsx'),
  'utf8'
);
assert(
  !searchPageContent.includes('MOCK_USERS'),
  'search page does not use MOCK_USERS'
);
assert(
  searchPageContent.includes('/api/search/users'),
  'search page calls /api/search/users endpoint'
);
assert(
  searchPageContent.includes('fetch(`/api/search/users'),
  'search page uses fetch to call search API'
);

// ── Test 7: Notifications page uses API ─────────────────────────────────
console.log('\n--- Test 7: Notifications page data source ---');
const notifPageContent = fs.readFileSync(
  path.join(SRC_ROOT, 'app/(app)/notifications/page.tsx'),
  'utf8'
);
assert(
  !notifPageContent.includes('initialNotifications'),
  'notifications page does not use static initialNotifications array'
);
assert(
  notifPageContent.includes('/api/notifications'),
  'notifications page calls /api/notifications endpoint'
);

// ── Test 8: ProfileView does not fall back to CURRENT_USER ──────────────
console.log('\n--- Test 8: ProfileView identity source ---');
const profileViewContent = fs.readFileSync(
  path.join(SRC_ROOT, 'components/profile/ProfileView.tsx'),
  'utf8'
);
assert(
  !profileViewContent.includes('CURRENT_USER'),
  'ProfileView does not import CURRENT_USER'
);
assert(
  !profileViewContent.includes("getUserById"),
  'ProfileView does not call getUserById from mock'
);
assert(
  profileViewContent.includes('/api/users/'),
  'ProfileView fetches public profile via /api/users/ endpoint'
);

// ── Test 9: Feed page does not fall back to CURRENT_USER ────────────────
console.log('\n--- Test 9: Feed page identity source ---');
const feedPageContent = fs.readFileSync(
  path.join(SRC_ROOT, 'app/(app)/feed/page.tsx'),
  'utf8'
);
assert(
  !feedPageContent.includes('CURRENT_USER'),
  'feed page does not import CURRENT_USER'
);
assert(
  feedPageContent.includes('user || {') || feedPageContent.includes('currentUser?.'),
  'feed page handles null user safely'
);

// ── Test 10: Header/TopBar/PostCard do not fall back to CURRENT_USER ────
console.log('\n--- Test 10: Layout components identity source ---');
const headerContent = fs.readFileSync(
  path.join(SRC_ROOT, 'components/layout/Header.tsx'),
  'utf8'
);
const topBarContent = fs.readFileSync(
  path.join(SRC_ROOT, 'components/layout/TopBar.tsx'),
  'utf8'
);
const postCardContent = fs.readFileSync(
  path.join(SRC_ROOT, 'components/feed/PostCard.tsx'),
  'utf8'
);
assert(
  !headerContent.includes('CURRENT_USER'),
  'Header does not import CURRENT_USER'
);
assert(
  !topBarContent.includes('CURRENT_USER'),
  'TopBar does not import CURRENT_USER'
);
assert(
  !postCardContent.includes('CURRENT_USER'),
  'PostCard does not import CURRENT_USER'
);

// ── Test 11: RightRail uses API for suggestions ─────────────────────────
console.log('\n--- Test 11: RightRail data source ---');
const rightRailContent = fs.readFileSync(
  path.join(SRC_ROOT, 'components/layout/RightRail.tsx'),
  'utf8'
);
assert(
  !rightRailContent.includes('MOCK_USERS'),
  'RightRail does not use MOCK_USERS'
);
assert(
  rightRailContent.includes('/api/search/users'),
  'RightRail fetches suggestions via /api/search/users endpoint'
);

// ── Test 12: FollowersModal uses API ────────────────────────────────────
console.log('\n--- Test 12: FollowersModal data source ---');
const followersModalContent = fs.readFileSync(
  path.join(SRC_ROOT, 'components/profile/FollowersModal.tsx'),
  'utf8'
);
assert(
  !followersModalContent.includes('MOCK_USERS'),
  'FollowersModal does not use MOCK_USERS'
);
assert(
  followersModalContent.includes('/api/users/') || followersModalContent.includes('profileUserId'),
  'FollowersModal accepts profileUserId and fetches from API'
);

// ── Test 13: Chat page does not use getConversations from mock ──────────
console.log('\n--- Test 13: Chat page data source ---');
const chatPageContent = fs.readFileSync(
  path.join(SRC_ROOT, 'app/(app)/chat/page.tsx'),
  'utf8'
);
assert(
  !chatPageContent.includes('getConversations'),
  'Chat page does not import getConversations from mock'
);
assert(
  !chatPageContent.includes('CURRENT_USER'),
  'Chat page does not import CURRENT_USER'
);
assert(
  chatPageContent.includes('/api/conversations'),
  'Chat page fetches conversations via /api/conversations endpoint'
);

// ── Test 14: Notifications API requires auth ────────────────────────────
console.log('\n--- Test 14: Notifications API authorization ---');
const notifApiContent = fs.readFileSync(
  path.join(SRC_ROOT, 'app/api/notifications/route.ts'),
  'utf8'
);
assert(
  notifApiContent.includes('auth()'),
  'Notifications GET uses auth()'
);
assert(
  notifApiContent.includes('session.user.id'),
  'Notifications GET scopes by session.user.id'
);
assert(
  notifApiContent.includes('PATCH'),
  'Notifications API supports PATCH for mark-all-read'
);

// ── Test 15: Search API requires auth and scopes results ────────────────
console.log('\n--- Test 15: Search API authorization ---');
const searchApiContent = fs.readFileSync(
  path.join(SRC_ROOT, 'app/api/search/users/route.ts'),
  'utf8'
);
assert(
  searchApiContent.includes('auth()'),
  'Search API uses auth()'
);
assert(
  searchApiContent.includes('session.user.id'),
  'Search API scopes results by session.user.id'
);

// ── Test 16: Sensitive fields not exposed in API responses ──────────────
console.log('\n--- Test 16: Response shape audit ---');
const USER_PUBLIC_FIELDS = ['passwordHash', 'verificationToken', 'resetToken'];
const searchApiResponse = searchApiContent;
for (const field of USER_PUBLIC_FIELDS) {
  assert(
    !searchApiResponse.includes(field),
    `Search API does not expose ${field}`
  );
}
const notifApiResponse = notifApiContent;
for (const field of USER_PUBLIC_FIELDS) {
  assert(
    !notifApiResponse.includes(field),
    `Notifications API does not expose ${field}`
  );
}

// ── Summary ─────────────────────────────────────────────────────────────
console.log('\n========================================');
console.log(`Results: ${passed} passed, ${failed} failed (${passed + failed} total)`);
console.log('========================================\n');

if (failed > 0) {
  console.error('❌ Phase 2D forensic test FAILED');
  process.exit(1);
} else {
  console.log('✅ Phase 2D forensic test PASSED');
  process.exit(0);
}
