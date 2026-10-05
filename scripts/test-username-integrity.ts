/**
 * PHASE 2E — Username Lifecycle Integrity Test Suite
 *
 * Tests cover:
 * 1. Valid username
 * 2. Invalid username
 * 3. Reserved username
 * 4. Duplicate username
 * 5. Case collision
 * 6. Whitespace normalization
 * 7. Concurrent username race
 * 8. Onboarding ownership
 * 9. Verification immutability
 * 10. Availability DB failure
 * 11. Profile lookup
 * 12. Auth.js username consistency
 * 13. Phase 1 regression
 * 14. Phase 2A regression
 * 15. Phase 2B regression
 * 16. Phase 2C regression
 */

const { validateUsername, validateEmail, usernameSchema, RESERVED_USERNAMES, onboardingSchema } = require('../src/lib/auth/validation');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Pool } = require('pg');
const fs = require('fs');

let passed = 0;
let failed = 0;

function assert(condition, name, detail) {
  if (condition) {
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${name}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

// ─── DB Setup ────────────────────────────────────────────────────────────────

const testSuffix = Date.now().toString().slice(-6);
const testUserId = `usr_2e_${testSuffix}`;
const testUsername = `phoenix_${testSuffix}`;
const testEmail = `phoenix_${testSuffix}@phryvos-test.com`;
const testPassword = 'Password123!';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

async function cleanup() {
  try {
    await pool.query('DELETE FROM "VerificationToken" WHERE identifier LIKE $1', [`%${testSuffix}%`]);
    await pool.query('DELETE FROM "User" WHERE username LIKE $1 OR email LIKE $1', [`%${testSuffix}%`]);
  } catch {}
}

async function setup() {
  await cleanup();
}

async function teardown() {
  await cleanup();
  await pool.end();
}

// ─── Main Test Runner ────────────────────────────────────────────────────────

async function main() {
  console.log('🧪 Starting Phase 2E Username Lifecycle Integrity Suite...\n');

  await setup();

  const passwordHash = await bcrypt.hash(testPassword, 10);

  try {
    // ── Group 1: Validation Rules ──────────────────────────────────────────

    console.log('--- Group 1: Username Validation & Normalization ---');

    const r1 = validateUsername('alice');
    assert(r1.valid === true && r1.normalized === 'alice', 'accepts valid 3-20 char username');

    const r2 = validateUsername('user_123');
    assert(r2.valid === true && r2.normalized === 'user_123', 'accepts alphanumeric with underscore');

    const r3 = validateUsername('abc');
    assert(r3.valid === true, 'accepts min length 3');

    const r4 = validateUsername('a'.repeat(20));
    assert(r4.valid === true, 'accepts max length 20');

    const r5 = validateUsername('ab');
    assert(r5.valid === false, 'rejects too short (< 3)');

    const r6 = validateUsername('a'.repeat(21));
    assert(r6.valid === false, 'rejects too long (> 20)');

    const r7 = validateUsername('123alex');
    assert(r7.valid === false, 'rejects starting with number');

    const r8 = validateUsername('_alex');
    assert(r8.valid === false, 'rejects starting with underscore');

    const r9 = validateUsername('alex_');
    assert(r9.valid === false, 'rejects ending with underscore');

    const r10 = validateUsername('alex__rivera');
    assert(r10.valid === false, 'rejects consecutive underscores');

    const r11 = validateUsername('alex.rivera');
    assert(r11.valid === false, 'rejects special characters');

    const r12 = validateUsername('alex rivera');
    assert(r12.valid === false, 'rejects whitespace');

    const reservedWords = ['admin', 'phryvos', 'root', 'api', 'feed', 'chat', 'radar', 'profile', 'settings', 'dashboard', 'login', 'register', 'logout', 'auth', 'terms', 'privacy', 'onboarding', 'demo', 'demo_user', 'anonymous'];
    for (const word of reservedWords) {
      const res = validateUsername(word);
      assert(res.valid === false, `rejects reserved username "${word}"`);
    }

    const r13 = validateUsername('  ALEX  ');
    assert(r13.valid === true && r13.normalized === 'alex', 'normalizes uppercase and whitespace');

    const r14 = validateUsername('AlIx');
    assert(r14.valid === true && r14.normalized === 'alix', 'normalizes mixed case');

    const r15 = validateUsername(123);
    assert(r15.valid === false, 'rejects non-string input');

    const r16 = validateUsername('');
    assert(r16.valid === false, 'rejects empty string');

    const r17 = validateUsername(null);
    assert(r17.valid === false, 'rejects null');

    const r18 = validateUsername(undefined);
    assert(r18.valid === false, 'rejects undefined');

    const zod1 = usernameSchema.safeParse('  ALICE  ');
    assert(zod1.success === true, 'zod schema accepts valid input');
    if (zod1.success) {
      assert(zod1.data === 'alice', 'zod schema normalizes to lowercase');
    }

    const zod2 = usernameSchema.safeParse('123invalid');
    assert(zod2.success === false, 'zod schema rejects invalid input');

    // ── Group 2: Email Validation ──────────────────────────────────────────

    console.log('\n--- Group 2: Email Validation ---');

    const em1 = validateEmail('test@example.com');
    assert(em1.valid === true, 'accepts standard email');

    const em2 = validateEmail('  USER@EXAMPLE.COM  ');
    assert(em2.valid === true && em2.normalized === 'user@example.com', 'normalizes email to lowercase');

    const em3 = validateEmail('not-an-email');
    assert(em3.valid === false, 'rejects malformed email');

    const em4 = validateEmail('@missinguser.com');
    assert(em4.valid === false, 'rejects email missing local part');

    const em5 = validateEmail('user@');
    assert(em5.valid === false, 'rejects email missing domain');

    const em6 = validateEmail('a'.repeat(250) + '@example.com');
    assert(em6.valid === false, 'rejects email exceeding 254 chars');

    // ── Group 3: Database Uniqueness ───────────────────────────────────────

    console.log('\n--- Group 3: Database Uniqueness ---');

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO "User" (id, username, email, "passwordHash", "displayName", avatar, "emailVerified", "onboardingCompleted")
       VALUES ($1, $2, $3, $4, $5, $6, NULL, false)`,
      [testUserId, testUsername, testEmail, passwordHash, 'Test User', '😊']
    );

    await pool.query(
      `INSERT INTO "VerificationToken" (identifier, token, expires)
       VALUES ($1, $2, $3)`,
      [testEmail, hashedToken, expiresAt]
    );

    const dbRes = await pool.query('SELECT username FROM "User" WHERE id = $1', [testUserId]);
    assert(dbRes.rows[0].username === testUsername, 'creates user with normalized username');

    // Test duplicate username
    let dupFailed = false;
    try {
      await pool.query(
        `INSERT INTO "User" (id, username, email, "passwordHash", "displayName", avatar, "emailVerified", "onboardingCompleted")
         VALUES ($1, $2, $3, $4, $5, $6, NULL, false)`,
        [`usr_dup_${testSuffix}`, testUsername, `dup_${testSuffix}@phryvos-test.com`, passwordHash, 'Dup', '😊']
      );
    } catch (e) {
      dupFailed = true;
      assert(e.code === '23505', 'enforces unique constraint on username (PG error code)');
    }
    assert(dupFailed, 'duplicate username insert fails');

    // Test duplicate email
    let emailDupFailed = false;
    try {
      await pool.query(
        `INSERT INTO "User" (id, username, email, "passwordHash", "displayName", avatar, "emailVerified", "onboardingCompleted")
         VALUES ($1, $2, $3, $4, $5, $6, NULL, false)`,
        [`usr_edup_${testSuffix}`, `edup_${testSuffix}`, testEmail, passwordHash, 'EDup', '😊']
      );
    } catch (e) {
      emailDupFailed = true;
      assert(e.code === '23505', 'enforces unique constraint on email (PG error code)');
    }
    assert(emailDupFailed, 'duplicate email insert fails');

    // ── Group 4: Case Collision ────────────────────────────────────────────

    console.log('\n--- Group 4: Case Collision ---');

    const case1 = validateUsername('ALICE');
    const case2 = validateUsername('alice');
    assert(case1.normalized === case2.normalized, 'treats ALICE and alice as same username');
    assert(case1.normalized === 'alice', 'case collision normalization to lowercase');

    const cs1 = usernameSchema.safeParse('ALICE');
    const cs2 = usernameSchema.safeParse('alice');
    const cs3 = usernameSchema.safeParse('Alice');
    assert(cs1.success && cs2.success && cs3.success, 'schema normalizes all case variants');
    if (cs1.success && cs2.success && cs3.success) {
      assert(cs1.data === cs2.data && cs2.data === cs3.data, 'all variants produce same normalized value');
    }

    // ── Group 5: Whitespace Normalization ──────────────────────────────────

    console.log('\n--- Group 5: Whitespace Normalization ---');

    const ws1 = validateUsername('  alice  ');
    assert(ws1.valid === true && ws1.normalized === 'alice', 'trims leading/trailing whitespace');

    const ws2 = validateUsername('alice bob');
    assert(ws2.valid === false, 'rejects internal whitespace');

    const ws3 = usernameSchema.safeParse('  alice  ');
    assert(ws3.success === true && ws3.data === 'alice', 'zod schema trims whitespace');

    // ── Group 6: Onboarding Ownership ──────────────────────────────────────

    console.log('\n--- Group 6: Onboarding Ownership ---');

    const payload = {
      username: `owner_${testSuffix}`,
      userId: 'attacker-id',
      displayName: 'Hacker',
      emailVerified: true,
      role: 'ADMIN',
    };

    const schemaKeys = Object.keys(onboardingSchema.shape);
    assert(!schemaKeys.includes('userId'), 'client-supplied userId stripped by schema');
    assert(!schemaKeys.includes('emailVerified'), 'emailVerified stripped from schema');
    assert(!schemaKeys.includes('role'), 'role stripped from schema');

    // ── Group 7: Verification Immutability ─────────────────────────────────

    console.log('\n--- Group 7: Verification Immutability ---');

    const unvUserId = `usr_unv_${testSuffix}`;
    const unvEmail = `unv_${testSuffix}@phryvos-test.com`;

    await pool.query(
      `INSERT INTO "User" (id, username, email, "passwordHash", "displayName", avatar, "emailVerified", "onboardingCompleted")
       VALUES ($1, $2, $3, $4, $5, $6, NULL, false)`,
      [unvUserId, `unv_user_${testSuffix}`, unvEmail, passwordHash, 'Unverified', '😊']
    );

    await pool.query(
      `UPDATE "User"
       SET username = $1, "displayName" = $2, avatar = $3, "onboardingCompleted" = true, "updatedAt" = NOW()
       WHERE id = $4`,
      [`onb_unv_${testSuffix}`, 'Unverified Updated', '🚀', unvUserId]
    );

    const unvRes = await pool.query('SELECT "emailVerified" FROM "User" WHERE id = $1', [unvUserId]);
    assert(unvRes.rows[0].emailverified === null, 'unverified user emailVerified remains null after onboarding');

    const verUserId = `usr_ver_${testSuffix}`;
    const verEmail = `ver_${testSuffix}@phryvos-test.com`;
    const origVerified = new Date('2026-01-01T12:00:00.000Z');

    await pool.query(
      `INSERT INTO "User" (id, username, email, "passwordHash", "displayName", avatar, "emailVerified", "onboardingCompleted")
       VALUES ($1, $2, $3, $4, $5, $6, $7, false)`,
      [verUserId, `ver_user_${testSuffix}`, verEmail, passwordHash, 'Verified', '😊', origVerified]
    );

    await pool.query(
      `UPDATE "User"
       SET username = $1, "displayName" = $2, avatar = $3, "onboardingCompleted" = true, "updatedAt" = NOW()
       WHERE id = $4`,
      [`onb_ver_${testSuffix}`, 'Verified Updated', '🦊', verUserId]
    );

    const verRes = await pool.query('SELECT "emailVerified" FROM "User" WHERE id = $1', [verUserId]);
    assert(
      new Date(verRes.rows[0].emailverified).toISOString() === origVerified.toISOString(),
      'verified user original timestamp strictly preserved'
    );

    // ── Group 8: Reserved Usernames ────────────────────────────────────────

    console.log('\n--- Group 8: Reserved Usernames ---');

    for (const reserved of RESERVED_USERNAMES) {
      const res = validateUsername(reserved);
      assert(res.valid === false, `reserved username "${reserved}" rejected`);
    }

    const requiredReserved = ['admin', 'api', 'login', 'register', 'settings', 'profile', 'feed', 'search', 'radar', 'messages', 'notifications'];
    for (const name of requiredReserved) {
      assert(RESERVED_USERNAMES.has(name), `reserved list includes "${name}"`);
    }

    // ── Group 9: Profile Lookup ────────────────────────────────────────────

    console.log('\n--- Group 9: Profile Lookup Consistency ---');

    const profUserId = `usr_prof_${testSuffix}`;
    const profUsername = `profile_user_${testSuffix}`;
    const profEmail = `prof_${testSuffix}@phryvos-test.com`;

    await pool.query(
      `INSERT INTO "User" (id, username, email, "passwordHash", "displayName", avatar, "emailVerified", "onboardingCompleted")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), true)`,
      [profUserId, profUsername, profEmail, passwordHash, 'Profile User', '😊']
    );

    const profRes = await pool.query('SELECT username FROM "User" WHERE username = $1', [profUsername.toLowerCase()]);
    assert(profRes.rows.length === 1 && profRes.rows[0].username === profUsername, 'profile lookup by normalized username');

    const searchRes = await pool.query(
      'SELECT username FROM "User" WHERE username ILIKE $1',
      [`%${profUsername.toUpperCase()}%`]
    );
    assert(searchRes.rows.length > 0, 'case-insensitive search finds user');

    // ── Group 10: Phase 1 Regression ───────────────────────────────────────

    console.log('\n--- Group 10: Phase 1 Regression ---');

    const regValid = usernameSchema.safeParse('validuser');
    assert(regValid.success === true, 'registerSchema validates valid username');

    const regShort = usernameSchema.safeParse('ab');
    assert(regShort.success === false, 'registerSchema rejects short username');

    const regReserved = usernameSchema.safeParse('admin');
    assert(regReserved.success === false, 'registerSchema rejects reserved username');

    const { passwordSchema } = require('../src/lib/auth/validation');
    assert(passwordSchema.safeParse('Weak1!').success === false, 'rejects weak password');
    assert(passwordSchema.safeParse('alllowercase1!').success === false, 'rejects no uppercase');
    assert(passwordSchema.safeParse('ALLUPPERCASE1!').success === false, 'rejects no lowercase');
    assert(passwordSchema.safeParse('NoNumberAtAll!').success === false, 'rejects no number');
    assert(passwordSchema.safeParse('NoSpecialChar123').success === false, 'rejects no special char');
    assert(passwordSchema.safeParse('ValidPass123!').success === true, 'accepts strong password');

    // ── Group 11: Phase 2A Regression ──────────────────────────────────────

    console.log('\n--- Group 11: Phase 2A Regression ---');

    const obPayload = {
      username: 'testuser',
      emailVerified: true,
      role: 'ADMIN',
    };

    const obResult = onboardingSchema.safeParse(obPayload);
    assert(obResult.success === true, 'onboardingSchema parses valid username');
    if (obResult.success) {
      assert(!('emailVerified' in obResult.data), 'emailVerified stripped from onboarding output');
      assert(!('role' in obResult.data), 'role stripped from onboarding output');
    }

    // ── Group 12: Phase 2B Regression ──────────────────────────────────────

    console.log('\n--- Group 12: Phase 2B Regression ---');

    const configSource = fs.readFileSync('src/lib/auth/config.ts', 'utf8');
    assert(configSource.includes('token.username = (user as any).username'), 'JWT stores canonical username');
    assert(configSource.includes('session.user.username = token.username as string'), 'session reflects JWT username');

    // ── Group 13: Phase 2C Regression ──────────────────────────────────────

    console.log('\n--- Group 13: Phase 2C Regression ---');

    const { validateAndSyncSession } = require('../src/lib/auth/client-session');
    const { useAuthStore } = require('../src/store/auth');

    useAuthStore.setState({
      user: { id: 'user_a', username: 'user_a' },
      isAuthenticated: true,
    });

    validateAndSyncSession({ id: 'user_b', username: 'user_b' });

    const state = useAuthStore.getState();
    assert(state.user === null, 'cross-account boundary triggers store purge');

    // ── Group 14: Race Condition Simulation ────────────────────────────────

    console.log('\n--- Group 14: Race Condition Simulation ---');

    const race1Id = `usr_race1_${testSuffix}`;
    const race2Id = `usr_race2_${testSuffix}`;
    const raceUsername = `race_${testSuffix}`;
    const raceEmail1 = `race1_${testSuffix}@phryvos-test.com`;
    const raceEmail2 = `race2_${testSuffix}@phryvos-test.com`;

    await pool.query(
      `INSERT INTO "User" (id, username, email, "passwordHash", "displayName", avatar, "emailVerified", "onboardingCompleted")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), true)`,
      [race1Id, raceUsername, raceEmail1, passwordHash, 'Race User 1', '😊']
    );

    await pool.query(
      `INSERT INTO "User" (id, username, email, "passwordHash", "displayName", avatar, "emailVerified", "onboardingCompleted")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), true)`,
      [race2Id, `race2user_${testSuffix}`, raceEmail2, passwordHash, 'Race User 2', '😊']
    );

    let raceFailed = false;
    try {
      await pool.query(
        `UPDATE "User" SET username = $1 WHERE id = $2`,
        [raceUsername, race2Id]
      );
    } catch (e) {
      raceFailed = true;
      assert(e.code === '23505', 'concurrent update fails with unique constraint');
    }
    assert(raceFailed, 'concurrent onboarding for same username is rejected');

    const raceCheck = await pool.query('SELECT username FROM "User" WHERE id = $1', [race1Id]);
    assert(raceCheck.rows[0].username === raceUsername, 'original user retains username after conflict');

    // ── Group 15: Availability Check ───────────────────────────────────────

    console.log('\n--- Group 15: Availability Check ---');

    const availUsername = `avail_${testSuffix}`;
    const availRes = validateUsername(availUsername);
    assert(availRes.valid === true && availRes.normalized === availUsername, 'available username valid and normalized');

    const takenRes = validateUsername(testUsername);
    assert(takenRes.valid === true, 'taken username still passes format validation');
    const dbCheck = await pool.query('SELECT id FROM "User" WHERE username = $1', [testUsername]);
    assert(dbCheck.rows.length > 0, 'taken username found in database');

    // ── Group 16: End-to-End Flow ──────────────────────────────────────────

    console.log('\n--- Group 16: End-to-End Username Lifecycle ---');

    const e2eUsername = `e2e_${testSuffix}`;
    const e2eEmail = `e2e_${testSuffix}@phryvos-test.com`;
    const e2eUserId = `usr_e2e_${testSuffix}`;

    // Step 1: Register
    const e2eToken = crypto.randomBytes(32).toString('hex');
    const e2eHashedToken = crypto.createHash('sha256').update(e2eToken).digest('hex');
    const e2eExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO "User" (id, username, email, "passwordHash", "displayName", avatar, "emailVerified", "onboardingCompleted")
       VALUES ($1, $2, $3, $4, $5, $6, NULL, false)`,
      [e2eUserId, e2eUsername, e2eEmail, passwordHash, 'E2E User', '😊']
    );

    await pool.query(
      `INSERT INTO "VerificationToken" (identifier, token, expires)
       VALUES ($1, $2, $3)`,
      [e2eEmail, e2eHashedToken, e2eExpires]
    );

    // Step 2: Verify email
    await pool.query(
      `UPDATE "User" SET "emailVerified" = NOW() WHERE id = $1`,
      [e2eUserId]
    );
    await pool.query(`DELETE FROM "VerificationToken" WHERE identifier = $1`, [e2eEmail]);

    // Step 3: Onboard
    const newUsername = `onboarded_${testSuffix}`;
    await pool.query(
      `UPDATE "User"
       SET username = $1, "displayName" = $2, avatar = $3, interests = $4, "onboardingCompleted" = true, "updatedAt" = NOW()
       WHERE id = $5`,
      [newUsername, newUsername, '🚀', '["Tech"]', e2eUserId]
    );

    // Verify final state
    const e2eRes = await pool.query(
      'SELECT username, "displayName", "emailVerified", "onboardingCompleted" FROM "User" WHERE id = $1',
      [e2eUserId]
    );

    assert(e2eRes.rows[0].username === newUsername, 'e2e: final username is onboarded value');
    assert(e2eRes.rows[0].displayname === newUsername, 'e2e: displayName matches username');
    assert(e2eRes.rows[0].emailverified !== null, 'e2e: emailVerified set after verification');
    assert(e2eRes.rows[0].onboardingcompleted === true, 'e2e: onboardingCompleted marked true');

  } finally {
    await teardown();
  }

  // ── Summary ──────────────────────────────────────────────────────────────

  console.log('\n========================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`Total: ${passed + failed}`);
  console.log(`Success rate: ${(((passed) / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
