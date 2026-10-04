import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Redirecting...',
};

export default function RedirectPage() {
  redirect('/');
}
