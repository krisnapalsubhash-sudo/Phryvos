import { z } from 'zod';

export const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'root',
  'phryvos',
  'support',
  'system',
  'moderator',
  'mod',
  'help',
  'official',
  'security',
  'staff',
  'api',
  'dev',
  'me',
  'null',
  'undefined',
  'demo',
  'demo_user',
  'anonymous',
  'feed',
  'chat',
  'radar',
  'profile',
  'settings',
  'dashboard',
  'login',
  'register',
  'logout',
  'auth',
  'terms',
  'privacy',
  'onboarding',
  'search',
  'messages',
  'notifications',
]);

/**
 * Normalizes a username to its canonical form.
 * Returns the trimmed, lowercased string regardless of validity.
 * Use alongside validateUsername() for full validation.
 */
export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

/**
 * Validates a username against canonical Phryvos rules:
 * - 3 to 20 characters
 * - Trimmed and lowercased
 * - Must start with a letter (a-z)
 * - May contain letters, numbers, and single underscores
 * - Must end with a letter or number (no trailing underscore)
 * - No consecutive underscores (__)
 * - Cannot be a reserved username
 */
export function validateUsername(input: unknown): { valid: boolean; error?: string; normalized?: string } {
  if (typeof input !== 'string') {
    return { valid: false, error: 'Username must be a string' };
  }

  const trimmed = normalizeUsername(input);

  if (trimmed.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  if (trimmed.length > 20) {
    return { valid: false, error: 'Username must be at most 20 characters' };
  }
  if (!/^[a-z]/.test(trimmed)) {
    return { valid: false, error: 'Username must start with a letter' };
  }
  if (!/^[a-z0-9_]+$/.test(trimmed)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  if (/__/.test(trimmed)) {
    return { valid: false, error: 'Username cannot contain consecutive underscores' };
  }
  if (trimmed.endsWith('_')) {
    return { valid: false, error: 'Username cannot end with an underscore' };
  }
  if (RESERVED_USERNAMES.has(trimmed)) {
    return { valid: false, error: 'This username is reserved and cannot be used' };
  }

  return { valid: true, normalized: trimmed };
}

// Canonical Username Zod Schema
export const usernameSchema = z.preprocess(
  (val) => (typeof val === 'string' ? normalizeUsername(val) : val),
  z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-z]/, 'Username must start with a letter')
    .regex(/^[a-z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .regex(/^[a-z0-9_]*[a-z0-9]$/, 'Username cannot end with an underscore')
    .refine((val) => !/__/.test(val), {
      message: 'Username cannot contain consecutive underscores',
    })
    .refine((val) => !RESERVED_USERNAMES.has(val), {
      message: 'This username is reserved and cannot be used',
    })
);

/**
 * Validates an email against canonical Phryvos rules
 */
export function validateEmail(input: unknown): { valid: boolean; error?: string; normalized?: string } {
  if (typeof input !== 'string') {
    return { valid: false, error: 'Email must be a string' };
  }

  const trimmed = input.trim().toLowerCase();
  if (!trimmed) {
    return { valid: false, error: 'Email is required' };
  }
  if (trimmed.length > 254) {
    return { valid: false, error: 'Email is too long' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true, normalized: trimmed };
}

// Canonical Email Zod Schema
export const emailSchema = z.preprocess(
  (val) => (typeof val === 'string' ? val.trim().toLowerCase() : val),
  z
    .string()
    .min(1, 'Email is required')
    .max(254, 'Email is too long')
    .email('Invalid email format')
);

// Canonical Password Zod Schema: min 8, max 128, upper, lower, number, special char
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password cannot exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Username or email is required').trim(),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => !data.confirmPassword || data.password === data.confirmPassword,
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }
  );

export const resendVerificationSchema = z.object({
  email: emailSchema,
});

export const onboardingSchema = z.object({
  username: usernameSchema,
  displayName: z.string().min(1).max(50).optional(),
  avatar: z.string().min(1).max(10).optional(),
  interests: z.array(z.string()).max(8).optional(),
  discoverySource: z.string().optional(),
  presetChosen: z.enum(['full', 'minimalist', 'custom']).optional(),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Invalid token'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Invalid token'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

// Post format enum
export const postFormatSchema = z.enum(['STANDARD', 'RAW', 'VOICE', 'MIDNIGHT']);

// Post creation schema
export const createPostSchema = z.object({
  content: z.string().trim().min(1, 'Content is required').max(10000, 'Content too long'),
  format: postFormatSchema.default('STANDARD'),
  image: z.string().url('Invalid image URL').optional().nullable(),
  audioDuration: z.number().int().min(1).max(300).optional().nullable(), // max 5 min
  voiceWaveform: z.array(z.number().int().min(0).max(100)).max(50).optional().nullable(),
  midnightGradient: z.string().max(100).optional().nullable(),
  isAnonymous: z.boolean().default(false),
  readingTime: z.string().max(20).optional().nullable(),
  vibe: z.string().max(50).optional().nullable(),
  tags: z.array(z.string().max(30)).max(10).optional().default([]),
});

// Post update schema (partial)
export const updatePostSchema = createPostSchema.partial().extend({
  id: z.string().min(1, 'Post ID required'),
});

// Comment schema
export const createCommentSchema = z.object({
  postId: z.string().min(1, 'Post ID required'),
  content: z.string().trim().min(1, 'Comment cannot be empty').max(2000, 'Comment too long'),
});

// Profile update schema
export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1)
    .max(50)
    .transform((val) => val.replace(/<[^>]*>?/gm, '').trim())
    .optional(),
  bio: z
    .string()
    .max(160)
    .transform((val) => val.replace(/<[^>]*>?/gm, '').trim())
    .optional(),
  location: z
    .string()
    .max(100)
    .transform((val) => val.replace(/<[^>]*>?/gm, '').trim())
    .optional(),
  avatar: z.string().max(255).optional(),
  cover: z.string().max(255).optional(),
  interests: z.array(z.string().max(30)).max(8).optional(),
});

// Search users schema
export const searchUsersSchema = z.object({
  q: z.string().min(1).max(100).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  isOnline: z.coerce.boolean().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type SearchUsersInput = z.infer<typeof searchUsersSchema>;