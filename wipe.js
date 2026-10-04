const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/phryvos' });

async function wipe() {
  console.log('Connecting to DB...');
  try {
    await pool.query('TRUNCATE TABLE "Message", "ConversationParticipant", "Conversation", "Notification", "Report", "Block", "Like", "Comment", "Post", "Connection", "Story", "VerificationToken", "Session", "Account", "User" CASCADE;');
    console.log('SUCCESS: All accounts and data deleted successfully.');
  } catch (err) {
    console.error('Failed to wipe data:', err.message);
  } finally {
    process.exit(0);
  }
}
wipe();
