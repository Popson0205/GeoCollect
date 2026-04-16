// portal/src/app/page.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('gc_token');
  if (!token) redirect('/login');
  redirect('/projects');
}
