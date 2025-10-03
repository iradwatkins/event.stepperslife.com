import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';
import { ThemeEditorEnhanced } from '@/components/theme/ThemeEditorEnhanced';

export const metadata = {
  title: 'Theme Editor | Admin',
  description: 'Customize your website theme with OKLCH colors and typography',
};

export default async function ThemeEditorPage() {
  const session = await auth();

  // Only allow SUPER_ADMIN access
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/unauthorized');
  }

  return (
    <ThemeProvider>
      <ThemeEditorEnhanced />
    </ThemeProvider>
  );
}
