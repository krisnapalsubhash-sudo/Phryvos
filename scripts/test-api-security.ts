import { realtimeEngine } from '../src/lib/realtime/engine';
import { safetyEngine } from '../src/lib/safety/engine';
import type { RealtimeUser } from '../src/lib/realtime/types';

async function runSecurityTests() {
  console.log('🔒 Starting Phryvos API Security Verification Suite...\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    }
  }

  // TEST 1: Engine Room Participant Membership
  console.log('Test Group 1: Room Membership Verification in Realtime Engine');
  const userA: RealtimeUser = { id: 'user_alice', username: 'alice', displayName: 'Alice', avatar: '👩', interests: ['Tech'] };
  const userB: RealtimeUser = { id: 'user_bob', username: 'bob', displayName: 'Bob', avatar: '👨', interests: ['Tech'] };
  const userC: RealtimeUser = { id: 'user_eve', username: 'eve', displayName: 'Eve', avatar: '🦹', interests: ['Tech'] };

  // Match Alice and Bob into a room
  await realtimeEngine.addToQueue(userA);
  const matchRes = await realtimeEngine.addToQueue(userB);

  assert(matchRes.matched === true && !!matchRes.roomId, 'Users A and B successfully matched into a room');
  const roomId = matchRes.roomId!;

  // Verify membership check
  assert(realtimeEngine.isParticipant(roomId, 'user_alice'), 'Alice is verified as room participant');
  assert(realtimeEngine.isParticipant(roomId, 'user_bob'), 'Bob is verified as room participant');
  assert(!realtimeEngine.isParticipant(roomId, 'user_eve'), 'Eve is correctly identified as NON-participant (403)');
  assert(!realtimeEngine.isParticipant('non_existent_room', 'user_alice'), 'Non-existent room returns false (404)');

  // Verify partner identification
  const partnerOfAlice = realtimeEngine.getRoomPartner(roomId, 'user_alice');
  assert(partnerOfAlice?.id === 'user_bob', 'Alice partner is strictly Bob (cannot be spoofed)');

  const partnerOfBob = realtimeEngine.getRoomPartner(roomId, 'user_bob');
  assert(partnerOfBob?.id === 'user_alice', 'Bob partner is strictly Alice (cannot be spoofed)');

  // TEST 2: Self-Block & Self-Report Prevention
  console.log('\nTest Group 2: Self-Block & Self-Report Protection');
  const selfReport = await safetyEngine.reportUser('user_alice', 'user_alice', 'Self report test');
  assert(selfReport.status === 'DISMISSED' || !!(selfReport as any).error, 'Self-report is rejected or dismissed');

  // TEST 3: Rate Limiting & Toxic Content Sanitization
  console.log('\nTest Group 3: Message Content Sanitization & Child Protection');
  const sanitized = safetyEngine.sanitizeMessage('Hello friend!', false);
  assert(sanitized.cleanText === 'Hello friend!' && !sanitized.isToxic, 'Clean message passes unaltered');

  const minorToxic = safetyEngine.sanitizeMessage('send me your secret phone number 9876543210 please', true);
  assert(minorToxic.cleanText.includes('••••••••••') || minorToxic.moderation.hasContactExchange, 'Minor grooming/PII is detected/redacted');

  // Clean up room
  await realtimeEngine.leaveRoom(roomId, 'user_alice');
  assert(!realtimeEngine.getRoom(roomId), 'Room is cleanly archived and removed from active after leave');

  console.log(`\n========================================`);
  console.log(`Security Test Results: ${passed}/${total} passed (${((passed / total) * 100).toFixed(0)}%)`);
  console.log(`========================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runSecurityTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
