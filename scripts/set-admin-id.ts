#!/usr/bin/env node

import { writeFileSync, readFileSync } from 'fs';

/**
 * Script to set the admin ID in .env.local
 * Usage: pnpm exec tsx scripts/set-admin-id.ts YOUR_USER_ID
 */

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ Error: Please provide your user ID');
    console.log('Usage: pnpm exec tsx scripts/set-admin-id.ts YOUR_USER_ID');
    process.exit(1);
  }

  const userId = args[0];

  if (!userId || userId.trim() === '') {
    console.error('❌ Error: User ID cannot be empty');
    process.exit(1);
  }

  const envPath = '.env.local';
  let envContent = '';

  try {
    // Try to read existing .env.local
    envContent = readFileSync(envPath, 'utf8');
  } catch (err) {
    // If .env.local doesn't exist, try .env.example
    try {
      envContent = readFileSync('.env.example', 'utf8');
    } catch (err2) {
      // If neither exists, start with empty content
      envContent = '';
    }
  }

  // Remove any existing NEXT_PUBLIC_ADMIN_ID line
  const lines = envContent.split('\n').filter(line =>
    !line.trim().startsWith('NEXT_PUBLIC_ADMIN_ID=') && line.trim() !== ''
  );

  // Add the new admin ID
  lines.push(`NEXT_PUBLIC_ADMIN_ID=${userId.trim()}`);

  // Write back to .env.local
  writeFileSync(envPath, lines.join('\n') + '\n');

  console.log(`✅ Successfully set NEXT_PUBLIC_ADMIN_ID=${userId.trim()} in ${envPath}`);
  console.log('\n📝 Next steps:');
  console.log('1. Restart your development server:');
  console.log('   pnpm dev --port 4000');
  console.log('2. Login with your account');
  console.log('3. Visit http://localhost:4000/admin/dashboard');
  console.log('4. You should now see the admin dashboard!');
}

try {
  main();
} catch (error) {
  console.error('❌ Error setting admin ID:', error);
  process.exit(1);
}