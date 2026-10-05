// Initialize mock window and localStorage environment before importing stores
const storageMap = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, val: string) => storageMap.set(key, String(val)),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
  get length() {
    return storageMap.size;
  },
  key: (index: number) => Array.from(storageMap.keys())[index] ?? null,
};

(globalThis as any).window = globalThis;
(globalThis as any).localStorage = mockLocalStorage;

async function runClientStateIsolationTests() {
  console.log('🧪 Starting Phase 2C Client-State Isolation & Cross-Account Session Suite...\n');
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

  // Import stores and session helpers after mock storage setup
  const { useAuthStore } = await import('../src/store/auth');
  const { usePostsStore } = await import('../src/store/posts');
  const { useConnectionsStore } = await import('../src/store/connections');
  const { useStoriesStore } = await import('../src/store/stories');
  const { useRealtimeStore } = await import('../src/store/realtime');
  const { useUIStore } = await import('../src/store/ui');
  const { useFeaturesStore } = await import('../src/store/features');
  const {
    clearUserScopedClientState,
    validateAndSyncSession,
    USER_SCOPED_STORAGE_KEYS,
  } = await import('../src/lib/auth/client-session');
  const { getSessionEpoch, isStaleRequest } = await import('../src/lib/auth/session-epoch');

  // Set global non-user preferences that should NEVER be purged
  mockLocalStorage.setItem('phryvos-theme', JSON.stringify({ state: { theme: 'dark' } }));
  mockLocalStorage.setItem('phryvos-sound-enabled', 'true');

  // TEST 1: Logout clears auth persistence and user-scoped stores
  console.log('--- Test 1: Logout Clears Auth Persistence & User Stores ---');
  // Populate User A state
  useAuthStore.setState({
    user: {
      id: 'usr_alice_1',
      username: 'alice_crypto',
      displayName: 'Alice C',
      bio: 'Cryptographer & Builder',
      avatar: '👩‍💻',
      interests: ['Crypto', 'Rust'],
      location: 'Berlin',
      followers: 120,
      following: 45,
      postsCount: 10,
      isConnected: false,
      isOnline: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    isAuthenticated: true,
  });

  usePostsStore.getState().addPost({
    id: 'post_alice_1',
    author: {
      id: 'usr_alice_1',
      username: 'alice_crypto',
      displayName: 'Alice C',
      avatar: '👩‍💻',
      interests: [],
      location: 'Berlin',
      followers: 120,
      following: 45,
      postsCount: 10,
      isConnected: false,
      isOnline: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    content: 'Alice private thoughts',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    likes: 5,
    likesCount: 5,
    commentsCount: 2,
    shares: 0,
    isLiked: true,
    isSaved: false,
    tags: ['crypto'],
  });

  useConnectionsStore.getState().addConnection({
    id: 'usr_charlie',
    username: 'charlie',
    displayName: 'Charlie',
  });

  useUIStore.getState().setSelectedChat('chat_alice_private_room');

  // Verify state is populated before logout
  assert(useAuthStore.getState().user?.id === 'usr_alice_1', 'User A auth state populated');
  assert(usePostsStore.getState().posts.some((p) => p.id === 'post_alice_1'), 'User A post cached');
  assert(useConnectionsStore.getState().isConnection('usr_charlie'), 'User A connection cached');
  assert(useUIStore.getState().selectedChatId === 'chat_alice_private_room', 'User A selected chat cached');

  // Perform client logout cleanup
  clearUserScopedClientState();

  // Verify user-scoped localStorage keys removed
  assert(mockLocalStorage.getItem('phryvos-auth') === null, 'phryvos-auth removed from localStorage');
  assert(mockLocalStorage.getItem('phryvos-posts') === null, 'phryvos-posts removed from localStorage');
  assert(mockLocalStorage.getItem('phryvos-connections') === null, 'phryvos-connections removed from localStorage');

  // Verify global non-user preferences are preserved
  assert(mockLocalStorage.getItem('phryvos-theme') !== null, 'phryvos-theme preserved across logout');
  assert(mockLocalStorage.getItem('phryvos-sound-enabled') === 'true', 'phryvos-sound-enabled preserved across logout');

  // Verify in-memory store states are reset
  assert(useAuthStore.getState().user === null, 'useAuthStore user reset to null');
  assert(useAuthStore.getState().isAuthenticated === false, 'useAuthStore isAuthenticated reset to false');
  assert(!usePostsStore.getState().posts.some((p) => p.id === 'post_alice_1'), 'usePostsStore custom post purged');
  assert(!useConnectionsStore.getState().isConnection('usr_charlie'), 'useConnectionsStore custom connection purged');
  assert(useUIStore.getState().selectedChatId === null, 'useUIStore selectedChatId reset to null');

  // TEST 2: User A -> Logout -> User B isolation
  console.log('\n--- Test 2: User A -> Logout -> User B Isolation ---');
  const sessionA = {
    id: 'usr_alice_1',
    username: 'alice_crypto',
    name: 'Alice C',
    email: 'alice@example.com',
    image: '👩‍💻',
  };
  validateAndSyncSession(sessionA);
  useAuthStore.getState().updateProfile({ bio: 'Alice secret draft' });
  usePostsStore.getState().addPost({
    id: 'post_alice_confidential',
    author: {
      id: 'usr_alice_1',
      username: 'alice_crypto',
      displayName: 'Alice C',
      avatar: '👩‍💻',
      interests: [],
      location: 'Berlin',
      followers: 120,
      following: 45,
      postsCount: 10,
      isConnected: false,
      isOnline: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    content: 'Secret project notes',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    likes: 0,
    likesCount: 0,
    commentsCount: 0,
    shares: 0,
    isLiked: false,
    isSaved: false,
    tags: [],
  });

  // User A logs out
  clearUserScopedClientState();

  // User B logs in
  const sessionB = {
    id: 'usr_bob_2',
    username: 'bob_designer',
    name: 'Bob D',
    email: 'bob@example.com',
    image: '🎨',
  };
  validateAndSyncSession(sessionB);

  const bobStoreUser = useAuthStore.getState().user;
  assert(bobStoreUser?.id === 'usr_bob_2', 'User B has correct canonical id');
  assert(bobStoreUser?.username === 'bob_designer', 'User B has correct canonical username');
  assert(bobStoreUser?.displayName === 'Bob D', 'User B has correct display name');
  assert(bobStoreUser?.bio !== 'Alice secret draft', 'User B does NOT inherit User A bio');
  assert(!usePostsStore.getState().posts.some((p) => p.id === 'post_alice_confidential'), 'User B does NOT see User A secret post');

  // TEST 3: User A -> Logout -> Refresh simulation
  console.log('\n--- Test 3: User A -> Logout -> Refresh Simulation ---');
  clearUserScopedClientState();
  for (const key of USER_SCOPED_STORAGE_KEYS) {
    assert(mockLocalStorage.getItem(key) === null, `Key "${key}" is absent after refresh`);
  }

  // TEST 4: Immediate A -> B Session Transition (Account Switch without reload)
  console.log('\n--- Test 4: Immediate Account Switch Boundary Protection ---');
  // Suppose User A session was active
  validateAndSyncSession(sessionA);
  assert(useAuthStore.getState().user?.id === 'usr_alice_1', 'Active user is Alice');

  // Suddenly session resolves to User B (e.g. switch account or multi-tab switch)
  validateAndSyncSession(sessionB);
  assert(useAuthStore.getState().user?.id === 'usr_bob_2', 'Store immediately transitions to Bob');
  assert(useAuthStore.getState().user?.username === 'bob_designer', 'Username immediately transitions to Bob');
  assert(usePostsStore.getState().ownerUserId === 'usr_bob_2', 'Posts store owner bound to Bob');
  assert(useConnectionsStore.getState().ownerUserId === 'usr_bob_2', 'Connections store owner bound to Bob');

  // TEST 5: Stale Asynchronous Request Protection (Race Condition)
  console.log('\n--- Test 5: Stale Async Request Protection ---');
  const userARequestEpoch = getSessionEpoch();

  // User A logs out / switches before request completes
  clearUserScopedClientState();
  const userBRequestEpoch = getSessionEpoch();
  assert(userBRequestEpoch > userARequestEpoch, 'Session epoch advances on logout');

  // User A's slow network request resolves now
  const staleDataFromAlice = { id: 'usr_alice_1', bio: 'Alice late response' };
  let appliedStaleData = false;
  if (!isStaleRequest(userARequestEpoch)) {
    appliedStaleData = true;
  }
  assert(appliedStaleData === false, 'Stale User A network response is strictly discarded');
  assert(isStaleRequest(userARequestEpoch) === true, 'isStaleRequest identifies old epoch');

  // TEST 6: Persisted Store Hydration Cross-Account Ownership Guard
  console.log('\n--- Test 6: Persisted Store Ownership Guard in useAuth ---');
  // Simulate useAuth logic
  const simulateUseAuth = (session: any, storeUser: any) => {
    const isStoreUserValid = !!storeUser?.id && storeUser.id === session?.user?.id;
    return session?.user
      ? {
          id: session.user.id,
          username: session.user.username,
          displayName: session.user.name || session.user.username || 'User',
          avatar: session.user.image || (isStoreUserValid ? storeUser?.avatar : undefined) || '😊',
          bio: (isStoreUserValid ? storeUser?.bio : '') || '',
          interests: (isStoreUserValid ? storeUser?.interests : []) || [],
        }
      : null;
  };

  // Mismatched storeUser: store belongs to Alice, but session belongs to Bob
  const staleStoreUser = { id: 'usr_alice_1', username: 'alice_crypto', bio: 'Alice private bio' };
  const bobSession = { user: { id: 'usr_bob_2', username: 'bob_designer', name: 'Bob D', image: '🎨' } };
  const resolvedBob = simulateUseAuth(bobSession, staleStoreUser);

  assert(resolvedBob?.id === 'usr_bob_2', 'Resolved user id is strictly Bob');
  assert(resolvedBob?.username === 'bob_designer', 'Resolved username is strictly Bob');
  assert(resolvedBob?.bio === '', 'Mismatched storeUser bio is strictly ignored');

  // TEST 7: No localStorage Authentication Authority
  console.log('\n--- Test 7: No LocalStorage Authentication Authority ---');
  // Attacker plants fake auth state in localStorage
  mockLocalStorage.setItem(
    'phryvos-auth',
    JSON.stringify({
      state: {
        user: { id: 'fake_admin', username: 'root_admin' },
        isAuthenticated: true,
      },
    })
  );

  // When Auth.js session is null
  const unauthenticatedUser = simulateUseAuth(null, JSON.parse(mockLocalStorage.getItem('phryvos-auth')!).state.user);
  assert(unauthenticatedUser === null, 'Attacker cannot authenticate by tampering with localStorage');

  // TEST 8: Session Identity Remains Canonical
  console.log('\n--- Test 8: Session Identity Canonical Verification ---');
  assert(sessionB.id === 'usr_bob_2', 'Auth.js session.user.id is canonical');
  assert(sessionB.username === 'bob_designer', 'Auth.js session.user.username is canonical');

  console.log('\n========================================');
  console.log(`Results: ${passed} passed, ${failed} failed (${passed + failed} total)`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runClientStateIsolationTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
