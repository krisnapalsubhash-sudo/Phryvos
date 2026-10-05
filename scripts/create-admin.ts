#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

/**
 * Script to help create an admin account for the Phryvos dashboard
 *
 * Usage:
 * 1. Register a normal account via /register page
 * 2. Note down your user ID from localStorage or browser dev tools
 * 3. Run this script to configure your admin ID
 *
 * Or, if you have database access, you can run the SQL directly
 */

async function main() {
  console.log('\n🔧 Phryvos Admin Account Setup');
  console.log('================================\n');

  console.log('Option 1: Register normally then promote to admin');
  console.log('1. Visit http://localhost:4000/register');
  console.log('2. Create your account');
  console.log('3. Login and check your user ID in localStorage');
  console.log('4. Run: pnpm exec tsx scripts/set-admin-id.ts YOUR_USER_ID\n');

  console.log('Option 2: Direct database setup (if you have access)');
  console.log('Run this SQL in your PostgreSQL database:');
  console.log('UPDATE users SET role = \'ADMIN\' WHERE id = \'YOUR_USER_ID\';');
  console.log('Then set NEXT_PUBLIC_ADMIN_ID=YOUR_USER_ID in .env.local\n');

  console.log('Option 3: Environment variable only (for development)');
  console.log('Set NEXT_PUBLIC_ADMIN_ID=your-user-id in .env.local');
  console.log('Note: This only restricts UI access, not API endpoints\n');

  // Check if .env.local exists
  try {
    const envPath = '.env.local';
    let envContent = '';

    try {
      envContent = readFileSync(envPath, 'utf8');
    } catch (err) {
      // File doesn't exist, create from example
      try {
        envContent = readFileSync('.env.example', 'utf8');
      } catch (err2) {
        envContent = '';
      }
    }

    // Check if admin ID is already set
    if (!envContent.includes('NEXT_PUBLIC_ADMIN_ID')) {
      console.log('\n📝 To complete setup:');
      console.log('1. Get your user ID from the database or after registration');
      console.log('2. Add this line to .env.local:');
      console.log('   NEXT_PUBLIC_ADMIN_ID=your-user-id-here');
      console.log('3. Restart the dev server\n');
    } else {
      console.log('\n✅ NEXT_PUBLIC_ADMIN_ID already set in .env.local');
    }

  } catch (error) {
    console.error('Error reading .env files:', error);
  }

  console.log('\n💡 To find your user ID:');
  console.log('- After registration/login, open browser dev tools');
  console.log('- Go to Application → Local Storage → http://localhost:4000');
  console.log('- Look for zustand key containing your user data');
  console.log('- Or check network requests to /api/auth/me\n');
}

main().catch(console.error);