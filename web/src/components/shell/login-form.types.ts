import { z } from 'zod';
import { buildDevLoginSchema } from './login-form.schema';

export type DevLoginValues = z.infer<ReturnType<typeof buildDevLoginSchema>>;

export type AccessLoginState = 'pending' | 'failed';
