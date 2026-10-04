import { z } from 'zod';

const RESERVED_USERNAMES = new Set([
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
]);

// Username: 3-20 chars, alphanumeric + underscore, must start with letter, cannot be reserved
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Username must start with a letter and contain only letters, numbers, and underscores')
  .transform((val) => val.toLowerCase().trim())
  .refine((val) => !RESERVED_USERNAMES.has(val), {
    message: 'This username is reserved and cannot be used',
  });

// Email: normalize, validate format
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(254, 'Email is too long')
  .transform((email) => email.toLowerCase().trim());

// Password: min 8 chars, require uppercase, lowercase, number, special char
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const loginSchema = z.object({
  username: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
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
  content: z.string().min(1, 'Content is required').max(10000, 'Content too long'),
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
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment too long'),
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
  website: z.string().url('Invalid URL').max(200).optional().nullable(),
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