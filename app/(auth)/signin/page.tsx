import { auth } from '@/auth';
import * as Sign from '@/features/sign/templates/index';
import Template from '@/app/template';
import { redirect } from 'next/navigation';

export default async function SignInPage(props: {
  searchParams: { callbackUrl?: string | string[] };
}) {
  const { searchParams } = props;
  const session = await auth();
  if (session) {
    // Determine callbackUrl string
    const raw = searchParams.callbackUrl;
    const cb = Array.isArray(raw) ? raw[0] : raw;
    // If non-admin tries admin page, skip redirect to allow re-login
    const isBlockedAdmin = cb === '/admin' && session.user.role !== 'ADMIN';
    if (!isBlockedAdmin) {
      // Otherwise, redirect: callbackUrl if exists, else default by role
      const dest = cb ?? (session.user.role === 'ADMIN' ? '/admin' : '/todo');
      redirect(dest);
    }
  }
  return (
    <Template showHeader={false}>
      <Sign.ContactWrapper />
    </Template>
  );
}
