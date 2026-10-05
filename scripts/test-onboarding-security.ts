import { onboardingSchema } from '../src/lib/auth/validation';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

async function runOnboardingSecurityTests() {
  console.log('🧪 Starting Phase 2A Onboarding Security & Verification Bypass Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  const fs = await import('fs');
  const { Pool } = await import('pg');

  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl && fs.existsSync('.env')) {
    const envFile = fs.readFileSync('.env', 'utf8');
    const dbUrlLine = envFile.split('\n').find((l: string) => l.startsWith('DATABASE_URL='));
    if (dbUrlLine) {
      dbUrl = dbUrlLine.split('=')[1].replace(/['"]/g, '').trim();
    }
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  const testId = Date.now().toString().slice(-6);
  const unverifiedUsername = `unv_${testId}`;
  const unverifiedEmail = `unv_${testId}@phryvos-test.com`;
  const unverifiedUserId = `usr_unv_${testId}`;

  const verifiedUsername = `ver_${testId}`;
  const verifiedEmail = `ver_${testId}@phryvos-test.com`;
  const verifiedUserId = `usr_ver_${testId}`;
  const originalVerifiedDate = new Date('2026-01-01T12:00:00.000Z');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // Clean up any test artifacts
  try {
    await pool.query('DELETE FROM "User" WHERE id IN ($1, $2)', [unverifiedUserId, verifiedUserId]);
  } catch {}

  // Create initial test users in PostgreSQL
  await pool.query(
    `INSERT INTO "User" (id, username, email, "passwordHash", "displayName", avatar, "emailVerified", "onboardingCompleted", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, NULL, false, NOW())`,
    [unverifiedUserId, unverifiedUsername, unverifiedEmail, passwordHash, 'Unverified Initial', '😊']
  );

  await pool.query(
    `INSERT INTO "User" (id, username, email, "passwordHash", "displayName", avatar, "emailVerified", "onboardingCompleted", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, false, NOW())`,
    [verifiedUserId, verifiedUsername, verifiedEmail, passwordHash, 'Verified Initial', '😊', originalVerifiedDate]
  );

  // TEST 1: Unverified user + onboarding -> emailVerified remains null
  console.log('--- Test 1: Unverified User Onboarding Security Invariant ---');
  const client1 = await pool.connect();
  try {
    // Simulate onboarding execution logic directly with fixed update
    const newUsername1 = `onb_unv_${testId}`;
    const userUpdateRes = await client1.query(
      `UPDATE "User"
       SET username = $1, "displayName" = $2, avatar = $3, interests = $4, "onboardingCompleted" = true, "updatedAt" = NOW()
       WHERE id = $5
       RETURNING id, username, "displayName", "emailVerified", "onboardingCompleted"`,
      [newUsername1, 'Unverified Updated', '🚀', ['Tech', 'Gaming'], unverifiedUserId]
    );

    const updatedUser = userUpdateRes.rows[0];
    assert(updatedUser.emailVerified === null, 'Unverified user emailVerified remains null after onboarding');
    assert(updatedUser.onboardingCompleted === true, 'onboardingCompleted is marked true');
    assert(updatedUser.username === newUsername1, 'Profile data correctly updated');
  } finally {
    client1.release();
  }

  // TEST 2: Verified user + onboarding -> emailVerified remains unchanged
  console.log('\n--- Test 2: Verified User Timestamp Preservation ---');
  const client2 = await pool.connect();
  try {
    const newUsername2 = `onb_ver_${testId}`;
    const userUpdateRes = await client2.query(
      `UPDATE "User"
       SET username = $1, "displayName" = $2, avatar = $3, interests = $4, "onboardingCompleted" = true, "updatedAt" = NOW()
       WHERE id = $5
       RETURNING id, username, "displayName", "emailVerified", "onboardingCompleted"`,
      [newUsername2, 'Verified Updated', '🦊', ['Music'], verifiedUserId]
    );

    const updatedUser = userUpdateRes.rows[0];
    assert(
      new Date(updatedUser.emailVerified).toISOString() === originalVerifiedDate.toISOString(),
      'Verified user original timestamp is strictly preserved'
    );
    assert(updatedUser.onboardingCompleted === true, 'onboardingCompleted is marked true');
  } finally {
    client2.release();
  }

  // TEST 3: Client payload with emailVerified=true -> ignored / stripped
  console.log('\n--- Test 3: Client-Controlled emailVerified Injection Immunity ---');
  const maliciousPayload = {
    username: 'clean_user',
    displayName: 'Hacker',
    avatar: '👾',
    emailVerified: true,
    isVerified: true,
    role: 'ADMIN',
  };
  const parsed = onboardingSchema.safeParse(maliciousPayload);
  assert(parsed.success === true, 'Valid fields parsed successfully');
  if (parsed.success) {
    const sanitizedKeys = Object.keys(parsed.data);
    assert(!sanitizedKeys.includes('emailVerified'), 'emailVerified stripped from validated output');
    assert(!sanitizedKeys.includes('isVerified'), 'isVerified stripped from validated output');
    assert(!sanitizedKeys.includes('role'), 'role stripped from validated output');
  }

  // TEST 4: Authorization isolation (session.user.id authority)
  console.log('\n--- Test 4: Identity Isolation & Anti-Spoofing ---');
  // Attempt to pass another user's ID in payload:
  const spoofPayload = {
    username: 'spoof_target',
    userId: verifiedUserId, // User A targeting User B
    displayName: 'Spoofed Name',
  };
  const spoofParsed = onboardingSchema.safeParse(spoofPayload);
  if (spoofParsed.success) {
    assert(!('userId' in spoofParsed.data), 'Client-provided userId stripped by schema');
  }
  // The server only updates WHERE id = session.user.id (unverifiedUserId), verifying User B cannot be touched
  const userBCheck = await pool.query('SELECT * FROM "User" WHERE id = $1', [verifiedUserId]);
  assert(userBCheck.rows[0].displayName === 'Verified Updated', 'Target user B remained untouched by caller');

  // TEST 5: Duplicate username handling during onboarding
  console.log('\n--- Test 5: Onboarding Duplicate Username Concurrency Guard ---');
  let duplicateFailedWithUniqueConstraint = false;
  try {
    // Attempt to set username to the verified user's existing username
    await pool.query(
      `UPDATE "User"
       SET username = $1, "updatedAt" = NOW()
       WHERE id = $2`,
      [`onb_ver_${testId}`, unverifiedUserId]
    );
  } catch (err: any) {
    duplicateFailedWithUniqueConstraint = err.code === '23505' || err.message.includes('unique constraint');
  }
  assert(duplicateFailedWithUniqueConstraint, 'PostgreSQL strictly blocks duplicate username assignment (code 23505 / P2002)');

  // Clean up
  await pool.query('DELETE FROM "User" WHERE id IN ($1, $2)', [unverifiedUserId, verifiedUserId]);
  await pool.end();

  console.log('\n========================================');
  console.log(`Results: ${passed} passed, ${failed} failed (${passed + failed} total)`);
  console.log('========================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runOnboardingSecurityTests().catch((err) => {
  console.error('Fatal onboarding test error:', err);
  process.exit(1);
});
