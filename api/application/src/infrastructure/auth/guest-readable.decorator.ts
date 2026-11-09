import { SetMetadata } from '@nestjs/common';
import { GUEST_READABLE_KEY } from '@infrastructure/auth/auth.constants';

export const GuestReadable = () => SetMetadata(GUEST_READABLE_KEY, true);
