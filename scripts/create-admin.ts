#!/usr/bin/env node

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

import { readFileSync, writeFileSync } from 'fs';

function main() {
  console.log('\n🔧 Phryvos Admin Account Setup');
  console.log('================================\n');

  console.log('📋 Step-by-step guide:');
  console.log('');
  console.log('Option 1: Register normally then promote to admin (Recommended)');
  console.log('1. Visit http://localhost:4000/register');
  console.log('2. Create your account');
  console.log('3. Login and open browser dev tools (F12)');
  console.log('4. Go to Application → Local Storage → http://localhost:4000');
  console.log('5. Look for "zustand-phryvos-auth" key');
  console.log('6. Find your user.id in the JSON');
  console.log('7. Run: pnpm exec tsx scripts/set-admin-id.ts YOUR_USER_ID\n');

  console.log('Option 2: Direct database setup (if you have access)');
  console.log('Run this SQL in your PostgreSQL database:');
  console.log(`
    -- Update user role to ADMIN
    UPDATE users
    SET role = 'ADMIN'
    WHERE username = 'your_username';

    -- Then set environment variable in .env.local:
    NEXT_PUBLIC_ADMIN_ID=your_user_id_here
  `);

  console.log('Option 3: Quick development setup (UI only)');
  console.log('Add to .env.local:');
  console.log('NEXT_PUBLIC_ADMIN_ID=your-user-id-here');
  console.log('Note: This only restricts UI access, not API endpoints\n');

  console.log('💡 How to find your user ID:');
  console.log('- After registration/login, open browser dev tools');
  console.log('- Go to Application → Local Storage → http://localhost:4000');
  console.log('- Look for zustand key containing your user data');
  console.log('- Or check network requests to /api/auth/me\n');

  // Check if .env.local exists
  try {
    const envPath = '.env.local';
    let envContent = '';

    try {
      envContent = readFileSync(envPath, 'utf8');
    } catch (err) {
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
      console.log('2. Run: pnpm exec tsx scripts/set-admin-id.ts YOUR_USER_ID');
      console.log('3. Restart the dev server\n');
    } else {
      console.log('\n✅ NEXT_PUBLIC_ADMIN_ID already set in .env.local');
    }

  } catch (error) {
    console.error('Error reading .env files:', error);
  }

  console.log('\n🚀 Next steps after setup:');
  console.log('1. Restart dev server: pnpm dev --port 4000');
  console.log('2. Login with your admin account');
  console.log('3. Visit: http://localhost:4000/admin/dashboard');
  console.log('4. You should see the admin dashboard!\n');
}

main();
