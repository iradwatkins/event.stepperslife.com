import NextAuth from 'next-auth';
import { authOptions } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

// Export runtime config separately to avoid Edge runtime issues
export { authOptions };