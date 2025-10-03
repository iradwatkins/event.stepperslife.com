import { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    role: UserRole;
    isVerified: boolean;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
      isVerified: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    role: UserRole;
    isVerified: boolean;
  }
}