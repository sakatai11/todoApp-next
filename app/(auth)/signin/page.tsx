import { auth } from '@/auth';
import * as Sign from '@/features/sign/templates/index';
import Template from '@/app/template';
import { redirect } from 'next/navigation';

export default async function SignInPage(props: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const session = await auth();
  if (session) {
    // General users always go to /todo
    if (session.user.role !== 'ADMIN') {
      redirect('/todo');
    }
    // Admin users: respect callbackUrl or default to /admin
    const params = await props.searchParams;
    const raw = params.callbackUrl;
    const cb = Array.isArray(raw) ? raw[0] : raw;
    redirect(cb ?? '/admin');
  }
  return (
    <Template showHeader={false}>
      <Sign.ContactWrapper />
    </Template>
  );
}
