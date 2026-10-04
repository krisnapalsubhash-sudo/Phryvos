import { NextResponse } from 'next/server';

export type ApiErrorCode =
  | 'AUTH_UNAUTHORIZED'
  | 'AUTH_FORBIDDEN'
  | 'AUTH_INVALID_CREDENTIALS'
  | 'VALIDATION_FAILED'
  | 'RESOURCE_NOT_FOUND'
  | 'RESOURCE_CONFLICT'
  | 'RATE_LIMITED'
  | 'SAFETY_USER_BLOCKED'
  | 'INTERNAL_SERVER_ERROR'
  | 'BAD_GATEWAY';

export interface ApiResponseEnvelope<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: ApiErrorCode;
  details?: unknown;
  timestamp: string;
}

/**
 * Creates a standardized success JSON response
 */
export function apiSuccess<T>(data: T, status = 200, headers?: HeadersInit): NextResponse<ApiResponseEnvelope<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status, headers }
  );
}

/**
 * Creates a standardized machine-readable error JSON response
 */
export function apiError(
  message: string,
  code: ApiErrorCode = 'INTERNAL_SERVER_ERROR',
  status = 500,
  details?: unknown
): NextResponse<ApiResponseEnvelope> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
      details: details ? details : undefined,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}
