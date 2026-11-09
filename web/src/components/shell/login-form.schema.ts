import { z } from 'zod';

export const buildDevLoginSchema = (emailMessage: string, nameMessage: string) => z.object({ email: z.string().email(emailMessage), name: z.string().min(1, nameMessage) });
