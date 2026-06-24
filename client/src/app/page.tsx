import { redirect } from 'next/navigation';

// Root path always goes to dashboard; dashboard redirects to /login if not authenticated.
export default function Home() {
  redirect('/dashboard');
}
