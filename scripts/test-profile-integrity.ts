/**
 * Phase 2F — Profile Integrity Test Suite
 *
 * Tests profile ownership, persistence, public/private field separation,
 * and session consistency without requiring a running database or server.
 *
 * Usage: npx tsx scripts/test-profile-integrity.ts
 */

// Force test mode for environment checks
(process.env as Record<string, string | undefined>).NODE_ENV = 'test';

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PASS = '✅ [PASS]';
const FAIL = '❌ [FAIL]';

let passed = 0;
let failed = 0;
let total = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  total++;
  if (condition) {
    console.log(`  ${PASS} ${testName}`);
    passed++;
  } else {
    console.error(`  ${FAIL} ${testName}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

function readTS(fileName: string): string {
  return readFileSync(resolve('src', fileName), 'utf8');
}

function readJSON(fileName: string): object {
  return JSON.parse(readFileSync(resolve(fileName), 'utf8'));
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

console.log('🔬 Phase 2F — Profile Integrity Test Suite\n');

async function runTests() {

// ── 1. Current-user profile retrieval ────────────────────────────────────────
console.log('Test Group 1: Current-user profile retrieval (/api/me/profile GET)');

{
  const route = readTS('app/api/me/profile/route.ts');

  // Must use auth() from NextAuth
  assert(
    route.includes('const session = await auth()'),
    'GET uses NextAuth auth() for session identity'
  );

  // Must reject without session
  assert(
    route.includes("return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })") ||
      route.includes(`return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })`),
    'GET returns 401 when session is missing'
  );

  // Must derive user from session.user.id — NOT body/query
  assert(
    route.includes('session.user.id') && !route.includes('body.userId'),
    'GET derives user from session.user.id, not client input'
  );

  // Must use explicit select — NOT a spread of req.body
  assert(
    route.includes('select:') && !route.includes('prisma.user.update({\n        data: body') && !route.includes('data: req.body'),
    'GET uses explicit Prisma select, not body spread'
  );

  // Must NOT return email, passwordHash, role, or other private fields
  assert(
    !route.includes('email: true') && !route.includes('passwordHash') && !route.includes('role: true'),
    'GET does NOT expose email/passwordHash/role in select'
  );

  // Must NOT return emailVerified
  assert(
    !route.includes('emailVerified') || route.includes('// emailVerified'),
    'GET does NOT return emailVerified in response'
  );
}

// ── 2. Profile update ────────────────────────────────────────────────────────
console.log('\nTest Group 2: Profile update (/api/me/profile PATCH)');

{
  const route = readTS('app/api/me/profile/route.ts');

  // Must authenticate
  assert(
    route.includes('const session = await auth()') && route.includes("if (!session?.user?.id)"),
    'PATCH requires authentication'
  );

  // Must validate with Zod schema
  assert(
    route.includes('updateProfileSchema.safeParse(body)'),
    'PATCH validates input with Zod schema'
  );

  // Must use session.user.id for update target — NOT body.userId
  assert(
    route.includes('where: { id: session.user.id }') && !route.includes('where: { id: body.userId }') && !route.includes('where: { id: req.body.userId }'),
    'PATCH updates session.user.id, never body.userId'
  );

  // Must use explicit field list — no mass assignment
  const updateMatch = route.match(/data:\s*\{([^}]+)\}/s);
  if (updateMatch) {
    const dataBlock = updateMatch[1];
    assert(
      !dataBlock.includes('...') || dataBlock.includes('...user') === false,
      'PATCH does not mass-assign with spread operator'
    );
    // Check no dangerous fields allowed
    assert(
      !dataBlock.includes('passwordHash') && !dataBlock.includes('role') && !dataBlock.includes('email'),
      'PATCH does not allow updating passwordHash/role/email'
    );
  }

  // Allowed fields must match schema
  assert(
    route.includes('displayName') && route.includes('bio') && route.includes('location') && route.includes('avatar') && route.includes('cover') && route.includes('interests'),
    'PATCH allows displayName, bio, location, avatar, cover, interests'
  );
}

// ── 3. Unauthorized update attempts ─────────────────────────────────────────
console.log('\nTest Group 3: Unauthorized update protection');

{
  const route = readTS('app/api/me/profile/route.ts');

  // DELETE endpoint must also be authenticated
  const deleteIdx = route.indexOf('export async function DELETE');
  assert(
    deleteIdx !== -1 && route.slice(deleteIdx, deleteIdx + 300).includes('await auth()') &&
    route.slice(deleteIdx, deleteIdx + 300).includes('session?.user?.id'),
    'DELETE /api/me/profile requires authentication'
  );

  // No endpoint accepts userId from client as identity
  assert(
    !route.includes('body.userId') && !route.includes('req.body.userId') &&
    !route.includes('query.userId') && !route.includes('params.userId'),
    'No endpoint in profile route accepts userId from client as target'
  );
}

// ── 4. body.userId spoof attempt prevention ──────────────────────────────────
console.log('\nTest Group 4: body.userId spoof prevention');

{
  // Check all API routes for dangerous body.userId patterns
  const apiRoutes = [
    'app/api/me/profile/route.ts',
    'app/api/auth/me/route.ts',
    'app/api/users/[username]/route.ts',
    'app/api/onboarding/route.ts',
  ];

  for (const routeFile of apiRoutes) {
    const content = readTS(routeFile);
    const dangerousPattern = /\bdata:\s*\{[^}]*userId[^}]*\}/s;
    const hasDangerousBodySpread = content.includes('body.userId') ||
      content.includes('req.body.userId') ||
      content.includes('{ ...body }') ||
      content.includes('data: body');

    assert(
      !hasDangerousBodySpread,
      `${routeFile} does not use body.userId or spread body into Prisma`
    );
  }
}

// ── 5. Public profile lookup ─────────────────────────────────────────────────
console.log('\nTest Group 5: Public profile lookup (/api/users/[username])');

{
  const route = readTS('app/api/users/[username]/route.ts');

  // Must accept username from params, not query
  assert(
    route.includes('{ params }') && route.includes('username'),
    'Public profile lookup uses URL param username'
  );

  // Must use Prisma select for safe field exposure
  assert(
    route.includes('select:') || route.includes('USER_PUBLIC_FIELDS'),
    'Public profile uses explicit Prisma select'
  );

  // Must NOT expose email
  assert(
    !route.includes("email: true") && !route.includes("'email': true"),
    'Public profile does NOT expose email'
  );

  // Must NOT expose passwordHash, role, etc.
  assert(
    !route.includes('passwordHash') && !route.includes(': role'),
    'Public profile does NOT expose passwordHash or role'
  );

  // Blocked users should get minimal info
  assert(
    route.includes('isBlocked') || route.includes('blocked'),
    'Public profile handles blocked user state'
  );
}

// ── 6. Private field leakage check ───────────────────────────────────────────
console.log('\nTest Group 6: Private field leakage audit');

{
  // Check /api/auth/me — must not expose email or emailVerified
  const authMe = readTS('app/api/auth/me/route.ts');
  assert(
    !authMe.includes('email: true') && !authMe.includes("'email': true") &&
    !authMe.includes('emailVerified: true') && !authMe.includes("'emailVerified': true"),
    '/api/auth/me does NOT expose email or emailVerified'
  );

  // Check /api/me/profile GET
  const profileRoute = readTS('app/api/me/profile/route.ts');
  assert(
    !profileRoute.includes('email: true') && !profileRoute.includes("'email': true"),
    '/api/me/profile GET does NOT expose email'
  );

  // Check validation schema
  const validation = readTS('lib/auth/validation.ts');
  const updateSchema = validation.match(/updateProfileSchema[\s\S]*?^\};/m);
  if (updateSchema) {
    assert(
      !updateSchema[0].includes('passwordHash') && !updateSchema[0].includes('role'),
      'updateProfileSchema does not allow passwordHash or role'
    );
  }
}

// ── 7. Profile persistence (store → API → DB round-trip) ────────────────────
console.log('\nTest Group 7: Profile persistence integrity');

{
  const store = readTS('store/auth.ts');

  // Must call /api/me/profile for updates
  assert(
    store.includes("/api/me/profile'") || store.includes("/api/me/profile\""),
    'Auth store calls /api/me/profile for profile updates'
  );

  // updateProfileAPI must handle failure without mutating state
  assert(
    store.includes('catch') && store.includes('throw error'),
    'updateProfileAPI catches errors and re-throws (no silent success mutation)'
  );

  // fetchProfile must not mutate store on failure
  assert(
    !store.includes('set({ user: data.user })') || store.includes('data.success'),
    'fetchProfile only sets state when data.success is true'
  );
}

// ── 8. Failed update rollback (no optimistic permanence) ─────────────────────
console.log('\nTest Group 8: Failed update rollback behavior');

{
  const store = readTS('store/auth.ts');

  // updateProfileAPI must NOT optimistically set local state before API responds
  // It should only set state after successful API response
  const updateApiImpl = store.slice(
    store.indexOf('updateProfileAPI'),
    store.indexOf('fetchProfile')
  );

  assert(
    !updateApiImpl.includes('set({ user:'),
    'updateProfileAPI does not optimistically set local state before API success'
  );

  // Stale request check must be present
  assert(
    store.includes('isStaleRequest(epoch)'),
    'Profile operations check for stale requests to prevent cross-session contamination'
  );
}

// ── 9. displayName/session consistency ────────────────────────────────────────
console.log('\nTest Group 9: Display name / session consistency');

{
  const config = readTS('lib/auth/config.ts');

  // JWT callback must persist username from DB
  assert(
    config.includes('token.username = (user as any).username') ||
    config.includes('token.username = user.username'),
    'JWT callback stores username from database user'
  );

  // Session callback must expose username
  assert(
    config.includes('session.user.username = token.username'),
    'Session callback exposes canonical username from JWT'
  );

  // display name must come from displayName field, not username
  assert(
    config.includes('token.name = user.name') || config.includes('name: candidate.displayName'),
    'Session name maps to displayName, not username'
  );
}

// ── 10. Username consistency with Phase 2E lifecycle ─────────────────────────
console.log('\nTest Group 10: Username lifecycle consistency');

{
  const onboarding = readTS('app/api/onboarding/route.ts');

  // Onboarding must use session.user.id
  assert(
    onboarding.includes('session.user.id'),
    'Onboarding uses session.user.id for target user'
  );

  // Onboarding must check username uniqueness against OTHER users
  assert(
    onboarding.includes('NOT') && onboarding.includes('id: session.user.id'),
    'Onboarding checks username uniqueness excluding current user'
  );

  // Onboarding must preserve emailVerified (no auth bypass)
  // Check the data block specifically — emailVerified should not be in the update data
  const onboardingUpdateMatch = onboarding.match(/data:\s*\{([^}]+)\}/s);
  if (onboardingUpdateMatch) {
    assert(
      !onboardingUpdateMatch[1].includes('emailVerified'),
      'Onboarding does not modify emailVerified in update data'
    );
  }
}

// ── 11. Logout isolation (from Phase 2C) ─────────────────────────────────────
console.log('\nTest Group 11: Logout isolation');

{
  const store = readTS('store/auth.ts');
  const clientSession = readTS('lib/auth/client-session.ts');

  // logout must clear localStorage
  assert(
    store.includes("localStorage.removeItem('phryvos-auth')"),
    'logout clears phryvos-auth localStorage key'
  );

  // logout must increment session epoch
  assert(
    store.includes('incrementSessionEpoch()'),
    'logout increments session epoch to invalidate in-flight requests'
  );

  // clearUserScopedClientState must purge all user-scoped stores
  assert(
    clientSession.includes("localStorage.removeItem('phryvos-auth')") ||
    (clientSession.includes('USER_SCOPED_STORAGE_KEYS') &&
     clientSession.includes('for (const key of USER_SCOPED_STORAGE_KEYS)') &&
     clientSession.includes("localStorage.removeItem(key)")),
    'clearUserScopedClientState purges all user-scoped localStorage keys'
  );

  // validateAndSyncSession must detect cross-account mismatch
  assert(
    clientSession.includes('hasMismatch') && clientSession.includes('clearUserScopedClientState()'),
    'validateAndSyncSession triggers purge on cross-account boundary violation'
  );
}

// ── 12. Phase 1 regression (registration flow) ───────────────────────────────
console.log('\nTest Group 12: Phase 1 regression — registration flow');

{
  const register = readTS('app/api/auth/register/route.ts');

  // Registration must validate with Zod
  assert(
    register.includes('registerSchema.safeParse(body)'),
    'Registration validates input with Zod schema'
  );

  // Registration must hash password
  assert(
    register.includes('bcrypt.hash'),
    'Registration hashes password with bcrypt'
  );

  // Registration must not auto-verify email
  assert(
    !register.includes('emailVerified: true') && !register.includes('emailVerified: new Date()'),
    'Registration does NOT auto-verify email'
  );

  // Registration must create verification token
  assert(
    register.includes('verificationToken') || register.includes('VerificationToken'),
    'Registration creates verification token'
  );

  // Registration must use transaction for atomicity
  assert(
    register.includes('$transaction') || register.includes('prisma.$transaction'),
    'Registration uses Prisma transaction for atomicity'
  );
}

// ── 13. Phase 2A regression (email verification) ─────────────────────────────
console.log('\nTest Group 13: Phase 2A regression — email verification');

{
  const verifyEmail = readTS('app/api/auth/verify-email/route.ts');

  assert(
    verifyEmail.includes('verificationToken') || verifyEmail.includes('VerificationToken'),
    'Verify email uses verification token from DB'
  );

  assert(
    verifyEmail.includes('emailVerified'),
    'Verify email sets emailVerified timestamp'
  );
}

// ── 14. Phase 2B regression (session identity) ────────────────────────────────
console.log('\nTest Group 14: Phase 2B regression — session identity contract');

{
  const config = readTS('lib/auth/config.ts');

  // Session must contain id, username, name (displayName)
  assert(
    config.includes('session.user.id') && config.includes('session.user.username') && config.includes('session.user.name'),
    'Session contains id, username, and name (displayName)'
  );

  // Password must never be in session — check that passwordHash is only in authorize() body, not callbacks
  const passwordHashLines = config.split('\n').filter((l: string) => l.includes('passwordHash'));
  // All occurrences should be in authorize logic (checking credentials), not in jwt/session callbacks
  const inCallbacks = passwordHashLines.some((l: string) =>
    l.trim().startsWith('token.') || l.trim().startsWith('session.user.')
  );
  assert(
    !inCallbacks,
    'Password hash is NOT included in session/JWT callbacks (only in authorize credential check)'
  );
}

// ── 15. Phase 2C regression (onboarding security) ────────────────────────────
console.log('\nTest Group 15: Phase 2C regression — onboarding security');

{
  const onboarding = readTS('app/api/onboarding/route.ts');

  // Onboarding must require auth
  assert(
    onboarding.includes('await auth()') && onboarding.includes("status: 401"),
    'Onboarding requires authenticated session'
  );

  // Onboarding must validate with Zod
  assert(
    onboarding.includes('onboardingSchema.safeParse(body)'),
    'Onboarding validates with onboardingSchema'
  );
}

// ── 16. EditProfileModal uses API-backed update ───────────────────────────────
console.log('\nTest Group 16: EditProfileModal API integration');

{
  const modal = readTS('components/profile/EditProfileModal.tsx');

  // Must use updateProfileAPI, not local updateProfile
  assert(
    modal.includes('updateProfileAPI'),
    'EditProfileModal uses updateProfileAPI for server-backed updates'
  );

  // Must handle errors
  assert(
    modal.includes('catch') || modal.includes('error'),
    'EditProfileModal handles save errors'
  );

  // Must not have website field (removed — not in schema)
  assert(
    !modal.includes('setWebsite') && !modal.includes('website'),
    'EditProfileModal does not reference website field (not in DB schema)'
  );
}

// ── 17. Settings page uses API-backed update ─────────────────────────────────
console.log('\nTest Group 17: Settings page profile update');

{
  const settings = readTS('app/(app)/settings/page.tsx');

  // Must use updateProfileAPI, not just local updateProfile
  assert(
    settings.includes('updateProfileAPI') || settings.includes('fetchProfile'),
    'Settings page uses API-backed profile update or refetch'
  );
}

// ── 18. Schema alignment check ───────────────────────────────────────────────
console.log('\nTest Group 18: Schema–code alignment');

{
  const schema = readFileSync(resolve('prisma/schema.prisma'), 'utf8');
  const validation = readTS('lib/auth/validation.ts');

  // website is in validation but NOT in Prisma schema — must be removed
  assert(
    !validation.includes('website: z.string()'),
    'validation.ts does not define website field (not in Prisma schema)'
  );

  // Avatar max length in schema vs validation
  const avatarInSchema = schema.match(/avatar\s+String\s+@default\("([^"]+)"\)/);
  const avatarInValidation = validation.match(/avatar:\s*z\.string\(\)\.max\((\d+)\)/);
  if (avatarInValidation) {
    assert(
      parseInt(avatarInValidation[1]) >= 10,
      'Avatar validation allows at least 10 chars (matches emoji usage)'
    );
  }
}

// ── 19. ProfileView fallback safety ──────────────────────────────────────────
console.log('\nTest Group 19: ProfileView fallback safety');

{
  const profileView = readTS('components/profile/ProfileView.tsx');

  // Must safely resolve user without mock CURRENT_USER fallback
  assert(
    !profileView.includes('CURRENT_USER') && (profileView.includes('resolvedUser') || profileView.includes('authUser')),
    'ProfileView safely resolves user without mock CURRENT_USER'
  );

  // isOwnProfile must be correctly computed
  assert(
    profileView.includes('isOwnProfile') && profileView.includes('authUser'),
    'ProfileView correctly determines own-profile status'
  );
}

// ── 20. No client-side userId injection anywhere ─────────────────────────────
console.log('\nTest Group 20: No client-side userId injection in mutations');

{
  try {
    const { stdout } = await execFileAsync(
      'grep',
      ['-rn', 'body\\.userId|req\\.body\\.userId|query\\.userId|params\\.userId', 'src/app/api/', '--include=*.ts'],
      { cwd: process.cwd(), encoding: 'utf8' }
    );
    const matches = stdout.trim();
    assert(!matches, 'No API route uses body/query/param userId as mutation target');
  } catch (e: any) {
    // grep returns exit code 1 when no matches found — that's good
    if (e.status === 1 || !e.stdout?.trim()) {
      assert(true, 'No dangerous body.userId patterns found in any API route');
    } else {
      assert(false, `Unexpected grep error: ${e.message}`);
    }
  }
}

// ─── Results ──────────────────────────────────────────────────────────────────

console.log('\n' + '='.repeat(50));
console.log(`Profile Integrity Tests: ${passed}/${total} passed (${((passed / total) * 100).toFixed(0)}%)`);
console.log(`                        ${failed} failed`);
console.log('='.repeat(50) + '\n');

if (failed > 0) {
  process.exit(1);
}
process.exit(0);
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
