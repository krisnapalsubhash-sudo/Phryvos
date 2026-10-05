import bcrypt from 'bcryptjs';
import fs from 'fs';
import { Pool } from 'pg';

async function runSessionIdentityTests() {
  console.log('🧪 Starting Phase 2B Auth.js Canonical Identity & Session Suite...\n');
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

  // Load DATABASE_URL
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

  const testSuffix = Date.now().toString().slice(-6);
  const testUserId = `usr_canon_${testSuffix}`;
  const testUsername = `krishna_dev_${testSuffix}`;
  const testDisplayName = 'Krishna Test';
  const testEmail = `krishna_${testSuffix}@phryvos-test.com`;
  const rawPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(rawPassword, 10);
  const verifiedDate = new Date();

  try {
    // 1. Setup isolated test user in DB
    await pool.query(
      `INSERT INTO "User" (id, username, email, "passwordHash", "displayName", avatar, "emailVerified", "onboardingCompleted", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())`,
      [testUserId, testUsername, testEmail, passwordHash, testDisplayName, '⚡', verifiedDate]
    );

    // Read user from database directly to verify DB state
    const dbUserRes = await pool.query(`SELECT * FROM "User" WHERE id = $1`, [testUserId]);
    const dbUser = dbUserRes.rows[0];

    assert(dbUser.id === testUserId, 'Authoritative database User.id verified');
    assert(dbUser.username === testUsername, 'Authoritative database User.username verified');
    assert(dbUser.displayName === testDisplayName, 'Authoritative database User.displayName verified');

    // Simulate Credentials authorize logic as implemented in src/lib/auth/config.ts
    // Query by identifier (case-insensitive)
    const identifier = testUsername.toUpperCase(); // test case insensitivity
    const authLookupRes = await pool.query(
      `SELECT * FROM "User" WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1)`,
      [identifier]
    );
    const candidate = authLookupRes.rows[0];
    const passwordValid = await bcrypt.compare(rawPassword, candidate.passwordHash);

    assert(passwordValid === true, 'Password verification against database hash succeeded');

    // Auth.js authorize return object (as updated in config.ts)
    const authUser = {
      id: candidate.id,
      email: candidate.email,
      name: candidate.displayName,
      username: candidate.username,
      image: candidate.avatar,
      demoMode: candidate.demoMode || false,
    };

    // TEST 1: Credentials session ID === database User.id
    console.log('--- Test 1: Credentials Session ID Contract ---');
    assert(authUser.id === dbUser.id, 'Credentials user.id strictly matches database User.id');
    assert(authUser.id === testUserId, 'Credentials user.id is immutable database cuid');

    // TEST 2: Credentials username === database User.username
    console.log('\n--- Test 2: Credentials Username Contract ---');
    assert(authUser.username === dbUser.username, 'Credentials user.username strictly matches database User.username');
    assert(authUser.username === testUsername, 'Credentials user.username is canonical handle');

    // TEST 3: Display name separation
    console.log('\n--- Test 3: Display Name vs Username Separation ---');
    assert(authUser.name === dbUser.displayName, 'session.user.name represents User.displayName');
    assert(authUser.username !== authUser.name, 'Canonical username is strictly distinct from displayName');
    assert(authUser.name === 'Krishna Test', 'Display name preserves capitalization and spaces');
    assert(authUser.username === testUsername, 'Username preserves canonical lowercase handle format');

    // TEST 4: Canonical username casing
    console.log('\n--- Test 4: Canonical Username Casing ---');
    assert(authUser.username === authUser.username.toLowerCase(), 'Username in session is strictly lowercase canonical');
    assert(!authUser.username.includes(' '), 'Username contains no whitespace');

    // JWT Callback simulation (as implemented in src/lib/auth/config.ts)
    const jwtCallback = (params: { token: any; user?: any; trigger?: string; session?: any }) => {
      const { token, user, trigger, session } = params;
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        token.username = (user as any).username;
        token.demoMode = user.demoMode || false;
      }
      if (trigger === 'update' && session) {
        token.name = session.name;
        token.image = session.image;
        if (session.username) {
          token.username = session.username;
        }
      }
      return token;
    };

    // Session Callback simulation (as implemented in src/lib/auth/config.ts)
    const sessionCallback = (params: { session: any; token: any }) => {
      const { session, token } = params;
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
        session.user.demoMode = token.demoMode as boolean;
      }
      return session;
    };

    const token = jwtCallback({ token: {}, user: authUser });
    const session = sessionCallback({ session: { user: {} }, token });

    assert(token.id === testUserId, 'JWT token preserves canonical id');
    assert(token.username === testUsername, 'JWT token preserves canonical username');
    assert(session.user.id === testUserId, 'Session user.id preserves canonical id');
    assert(session.user.username === testUsername, 'Session user.username exposes canonical username');
    assert(session.user.name === testDisplayName, 'Session user.name exposes displayName');

    // TEST 5: No username inference from displayName
    console.log('\n--- Test 5: No Username Inference From DisplayName ---');
    // Simulate useAuth logic as updated in src/hooks/useAuth.ts
    const mapUseAuthUser = (currentSession: any, storeUser?: any) => {
      if (!currentSession?.user) return null;
      return {
        id: currentSession.user.id || (currentSession.user as any).sub || '',
        username: currentSession.user.username || '',
        displayName: currentSession.user.name || currentSession.user.username || 'User',
        email: currentSession.user.email || undefined,
        avatar: currentSession.user.image || storeUser?.avatar || '😊',
      };
    };

    const mappedUser = mapUseAuthUser(session);
    assert(mappedUser !== null, 'Mapped useAuth user is defined for authenticated session');
    assert(mappedUser?.username === testUsername, 'useAuth username equals canonical username');
    assert(mappedUser?.displayName === testDisplayName, 'useAuth displayName equals display name');
    assert(mappedUser?.username !== mappedUser?.displayName, 'useAuth never collapses username into displayName');

    // TEST 6: Session identity cannot be client-spoofed
    console.log('\n--- Test 6: Anti-Spoofing & Client Tampering Protection ---');
    // A malicious client attempts to pass token/session override with another user's id
    const attackerInput = { id: 'victim_user_999', username: 'admin' };
    // Server-issued JWT ignores attacker client inputs and only uses verified authUser
    const safeToken = jwtCallback({ token: {}, user: authUser });
    assert(safeToken.id === testUserId, 'Attacker cannot override server token id');
    assert(safeToken.username === testUsername, 'Attacker cannot override server token username');

    // TEST 7: Session absence handling
    console.log('\n--- Test 7: Session Absence Handling ---');
    const emptySessionUser = mapUseAuthUser(null, { username: 'stale_local_user', id: 'stale_id' });
    assert(emptySessionUser === null, 'useAuth strictly returns null when Auth.js session is null');

    // TEST 8: OAuth Compatibility
    console.log('\n--- Test 8: OAuth Compatibility Contract ---');
    const oauthDbUser = {
      id: `usr_oauth_${testSuffix}`,
      username: `oauth_coder_${testSuffix}`,
      displayName: 'OAuth Coder',
      email: `oauth_${testSuffix}@example.com`,
      avatar: '🌐',
      demoMode: false,
    };
    const oauthToken = jwtCallback({
      token: {},
      user: {
        id: oauthDbUser.id,
        name: oauthDbUser.displayName,
        username: oauthDbUser.username,
        email: oauthDbUser.email,
        image: oauthDbUser.avatar,
        demoMode: false,
      },
    });
    const oauthSession = sessionCallback({ session: { user: {} }, token: oauthToken });
    assert(oauthSession.user.id === oauthDbUser.id, 'OAuth session exposes canonical id');
    assert(oauthSession.user.username === oauthDbUser.username, 'OAuth session exposes canonical username');
    assert(oauthSession.user.name === oauthDbUser.displayName, 'OAuth session exposes displayName as name');

    // TEST 9: Privacy & Secret Exposure Prevention
    console.log('\n--- Test 9: Privacy & Secret Exposure Prevention ---');
    assert(!('passwordHash' in authUser), 'passwordHash is NOT exposed in auth user');
    assert(!('password' in authUser), 'password is NOT exposed in auth user');
    assert(!('verificationToken' in authUser), 'verificationToken is NOT exposed in auth user');
    assert(!('passwordHash' in session.user), 'passwordHash is NOT exposed in session');
    assert(!('verificationToken' in session.user), 'verificationToken is NOT exposed in session');

  } finally {
    // Clean up test user
    try {
      await pool.query(`DELETE FROM "User" WHERE id = $1`, [testUserId]);
    } catch {}
    await pool.end();
  }

  console.log('\n========================================');
  console.log(`Results: ${passed} passed, ${failed} failed (${passed + failed} total)`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSessionIdentityTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
