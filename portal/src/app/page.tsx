// portal/src/app/page.tsx
// Project catalog — lists all accessible projects with feature count + thumbnail.

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default function Home() {
  // Redirect unauthenticated users to login
  const cookieStore = cookies();
  const token = cookieStore.get('gc_token');
  if (!token) redirect('/login');
  redirect('/projects');
}
