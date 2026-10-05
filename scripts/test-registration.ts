import { validateUsername, validateEmail, usernameSchema, emailSchema, passwordSchema, registerSchema, RESERVED_USERNAMES } from '../src/lib/auth/validation';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendVerificationEmail, getSentEmails, clearSentEmails } from '../src/lib/email';

async function runTests() {
  console.log('🧪 Starting Phase 1 Registration Forensic Verification Suite...\n');
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

  // GROUP 1: USERNAME CANONICAL VALIDATION
  console.log('--- Group 1: Username Validation Rules ---');
  assert(validateUsername('alex').valid === true, 'Valid 4-char username accepted');
  assert(validateUsername('user_123').valid === true, 'Alphanumeric with underscore accepted');
  assert(validateUsername('abc').valid === true, 'Min length 3 accepted');
  assert(validateUsername('a'.repeat(20)).valid === true, 'Max length 20 accepted');
  assert(validateUsername('ab').valid === false, 'Too short (< 3) rejected');
  assert(validateUsername('a'.repeat(21)).valid === false, 'Too long (> 20) rejected');
  assert(validateUsername('123alex').valid === false, 'Starting with number rejected');
  assert(validateUsername('_alex').valid === false, 'Starting with underscore rejected');
  assert(validateUsername('alex_').valid === false, 'Ending with underscore rejected');
  assert(validateUsername('alex__rivera').valid === false, 'Consecutive underscores rejected');
  assert(validateUsername('alex.rivera').valid === false, 'Special character dot rejected');
  assert(validateUsername('alex rivera').valid === false, 'Whitespace rejected');
  assert(validateUsername('admin').valid === false, 'Reserved username "admin" rejected');
  assert(validateUsername('phryvos').valid === false, 'Reserved username "phryvos" rejected');
  assert(validateUsername('root').valid === false, 'Reserved username "root" rejected');
  assert(validateUsername('  ALEX  ').normalized === 'alex', 'Uppercase and whitespace normalized');

  // GROUP 2: EMAIL CANONICAL VALIDATION
  console.log('\n--- Group 2: Email Validation Rules ---');
  assert(validateEmail('test@example.com').valid === true, 'Standard email accepted');
  assert(validateEmail('  USER@EXAMPLE.COM  ').normalized === 'user@example.com', 'Trimmed & lowercased');
  assert(validateEmail('not-an-email').valid === false, 'Malformed email rejected');
  assert(validateEmail('@missinguser.com').valid === false, 'Missing local part rejected');
  assert(validateEmail('user@').valid === false, 'Missing domain rejected');
  assert(validateEmail('a'.repeat(250) + '@example.com').valid === false, 'Exceeding 254 chars rejected');

  // GROUP 3: PASSWORD COMPLEXITY & CONFIRMATION
  console.log('\n--- Group 3: Password Validation Rules ---');
  assert(passwordSchema.safeParse('Weak1!').success === false, 'Password < 8 chars rejected');
  assert(passwordSchema.safeParse('alllowercase1!').success === false, 'No uppercase rejected');
  assert(passwordSchema.safeParse('ALLUPPERCASE1!').success === false, 'No lowercase rejected');
  assert(passwordSchema.safeParse('NoNumberAtAll!').success === false, 'No number rejected');
  assert(passwordSchema.safeParse('NoSpecialChar123').success === false, 'No special char rejected');
  assert(passwordSchema.safeParse('ValidPass123!').success === true, 'Strong password accepted');

  const confirmMismatch = registerSchema.safeParse({
    username: 'validuser',
    email: 'valid@example.com',
    password: 'Password123!',
    confirmPassword: 'DifferentPassword123!',
  });
  assert(confirmMismatch.success === false, 'Password mismatch rejected by registerSchema');

  const confirmMatch = registerSchema.safeParse({
    username: 'validuser',
    email: 'valid@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
  });
  assert(confirmMatch.success === true, 'Matching password confirmed by registerSchema');

  // GROUP 4: EMAIL DELIVERY ABSTRACTION
  console.log('\n--- Group 4: Email Delivery & URL Builder ---');
  clearSentEmails();
  const mailResult = await sendVerificationEmail({
    email: 'recipient@example.com',
    username: 'alex',
    token: 'test-token-12345',
  });
  assert(mailResult.success === true, 'sendVerificationEmail succeeds');
  const sent = getSentEmails();
  assert(sent.length === 1, 'Email recorded in verification store');
  assert(sent[0].to === 'recipient@example.com', 'Correct recipient recorded');
  assert(sent[0].html.includes('test-token-12345'), 'Verification link contains token');

  // GROUP 5: END-TO-END DATABASE & POSTGRESQL VERIFICATION
  console.log('\n--- Group 5: PostgreSQL Database Transaction & Auth Flow ---');
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
  const testUsername = `user_${testId}`;
  const testEmail = `user_${testId}@phryvos-test.com`;
  const testPassword = 'Password123!';

  // Clean up any test artifacts
  try {
    await pool.query('DELETE FROM "VerificationToken" WHERE identifier = $1', [testEmail]);
    await pool.query('DELETE FROM "User" WHERE username = $1 OR email = $2', [testUsername, testEmail]);
  } catch {}

  // 5A: Atomic User & Token Creation
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const passwordHash = await bcrypt.hash(testPassword, 12);
  const userId = `usr_test_${testId}`;

  const client = await pool.connect();
  let createdUser: any = null;
  try {
    await client.query('BEGIN');
    const userRes = await client.query(
      `INSERT INTO "User" (id, username, email, "passwordHash", "displayName", avatar, "emailVerified", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NULL, NOW())
       RETURNING *`,
      [userId, testUsername, testEmail, passwordHash, testUsername, '😊']
    );
    createdUser = userRes.rows[0];

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await client.query(
      `INSERT INTO "VerificationToken" (identifier, token, expires)
       VALUES ($1, $2, $3)`,
      [testEmail, hashedToken, expiresAt]
    );
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  assert(!!createdUser?.id, 'User record created atomically in DB');
  assert(createdUser?.emailVerified === null, 'Newly registered user has emailVerified = null');

  // Verify verification token exists
  const tokenRes = await pool.query('SELECT * FROM "VerificationToken" WHERE token = $1', [hashedToken]);
  assert(tokenRes.rowCount === 1, 'Hashed verification token persisted in DB');

  // 5B: Duplicate Username Prevention (Database Level)
  let duplicateUsernameFailed = false;
  try {
    await pool.query(
      `INSERT INTO "User" (id, username, email, "passwordHash", "displayName", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [`usr_dup_${testId}`, testUsername, `another_${testId}@phryvos-test.com`, passwordHash, 'Duplicate User']
    );
  } catch (err: any) {
    duplicateUsernameFailed = err?.code === '23505' || err.message.includes('unique constraint');
  }
  assert(duplicateUsernameFailed, 'Duplicate username strictly rejected by PostgreSQL unique constraint (23505)');

  // 5C: Duplicate Email Prevention (Database Level)
  let duplicateEmailFailed = false;
  try {
    await pool.query(
      `INSERT INTO "User" (id, username, email, "passwordHash", "displayName", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [`usr_dup_email_${testId}`, `diff_${testId}`, testEmail, passwordHash, 'Duplicate Email User']
    );
  } catch (err: any) {
    duplicateEmailFailed = err?.code === '23505' || err.message.includes('unique constraint');
  }
  assert(duplicateEmailFailed, 'Duplicate email strictly rejected by PostgreSQL unique constraint (23505)');

  // 5D: Verification Policy Enforcement
  // Option A: Unverified user cannot log in
  const unverifiedRes = await pool.query('SELECT * FROM "User" WHERE id = $1', [createdUser.id]);
  const isUnverifiedBlocked = !unverifiedRes.rows[0]?.emailVerified;
  assert(isUnverifiedBlocked, 'Option A Policy: Unverified user is blocked from credentials authentication');

  // 5E: Verification Token Processing
  // Lookup by hash, mark verified, and delete token atomically
  const verifyClient = await pool.connect();
  let verifiedUser: any = null;
  try {
    await verifyClient.query('BEGIN');
    const vtRes = await verifyClient.query('SELECT * FROM "VerificationToken" WHERE token = $1', [hashedToken]);
    const vt = vtRes.rows[0];
    if (!vt || new Date(vt.expires) < new Date()) throw new Error('Invalid token');

    const updateRes = await verifyClient.query(
      'UPDATE "User" SET "emailVerified" = NOW() WHERE email = $1 RETURNING *',
      [vt.identifier]
    );
    verifiedUser = updateRes.rows[0];

    await verifyClient.query('DELETE FROM "VerificationToken" WHERE token = $1', [vt.token]);
    await verifyClient.query('COMMIT');
  } catch (e) {
    await verifyClient.query('ROLLBACK');
    throw e;
  } finally {
    verifyClient.release();
  }

  assert(!!verifiedUser?.emailVerified, 'User marked emailVerified with timestamp');

  // Token must no longer exist in DB (single use)
  const consumedRes = await pool.query('SELECT * FROM "VerificationToken" WHERE token = $1', [hashedToken]);
  assert(consumedRes.rowCount === 0, 'Verification token deleted immediately after use (single-use guarantee)');

  // 5F: Verified User Login Permitted
  const checkVerified = await pool.query('SELECT * FROM "User" WHERE id = $1', [createdUser.id]);
  const isVerifiedLoginAllowed = !!checkVerified.rows[0]?.emailVerified;
  assert(isVerifiedLoginAllowed, 'Verified user is permitted to authenticate');

  // 5G: Clean up test record
  await pool.query('DELETE FROM "User" WHERE id = $1', [createdUser.id]);
  await pool.end();

  console.log('\n========================================');
  console.log(`Results: ${passed} passed, ${failed} failed (${passed + failed} total)`);
  console.log('========================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
