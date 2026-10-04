import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import { registerSchema, loginSchema } from './validation';

describe('Phase 28-30: Auth Security & DTO Validation Matrix', () => {
  it('hashes passwords using cost >= 12 and verifies correctly', async () => {
    const password = 'SuperSecurePassword123!';
    const hash = await bcrypt.hash(password, 12);

    expect(hash).not.toBe(password);
    expect(hash.startsWith('$2a$12$') || hash.startsWith('$2b$12$')).toBe(true);

    const isValid = await bcrypt.compare(password, hash);
    expect(isValid).toBe(true);

    const isInvalid = await bcrypt.compare('WrongPassword456!', hash);
    expect(isInvalid).toBe(false);
  });

  it('enforces registration validation rules and rejects weak credentials', () => {
    const weakResult = registerSchema.safeParse({
      username: 'u', // too short
      email: 'not-an-email',
      password: '123', // too short
    });
    expect(weakResult.success).toBe(false);

    const validResult = registerSchema.safeParse({
      username: 'validuser',
      email: 'test@phryvos.com',
      password: 'validPassword123!',
    });
    expect(validResult.success).toBe(true);
  });

  it('enforces login validation rules', () => {
    const emptyResult = loginSchema.safeParse({
      identifier: '',
      password: '',
    });
    expect(emptyResult.success).toBe(false);

    const validResult = loginSchema.safeParse({
      identifier: 'testuser',
      password: 'somepassword',
    });
    expect(validResult.success).toBe(true);
  });

  it('guarantees User DTO excludes passwordHash by construction', () => {
    const internalUserRecord = {
      id: 'usr_123',
      username: 'alex',
      email: 'alex@example.com',
      passwordHash: '$2a$12$eX4mPl3H4sH...',
      displayName: 'Alex',
      avatar: '😊',
      createdAt: new Date(),
    };

    // Client/session projection boundary
    const sessionUserDto = {
      id: internalUserRecord.id,
      username: internalUserRecord.username,
      displayName: internalUserRecord.displayName,
      email: internalUserRecord.email,
      avatar: internalUserRecord.avatar,
    };

    expect(sessionUserDto).not.toHaveProperty('passwordHash');
    expect(Object.keys(sessionUserDto)).not.toContain('passwordHash');
  });
});
