import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @description Mark a resolver/handler as public (no authentication required).
 * When applied, the JwtAuthGuard will skip token validation.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
