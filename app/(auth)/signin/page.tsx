import { auth } from '@/auth';
import * as Sign from '@/features/sign/templates/index';
import Template from '@/app/template';
import { redirect } from 'next/navigation';

export default async function SignInPage(props: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const session = await auth();
  // retrieve callbackUrl if present
  const params = await props.searchParams;
  const raw = params.callbackUrl;
  const cb = Array.isArray(raw) ? raw[0] : raw;
  const decodedCb = cb ? decodeURIComponent(cb) : undefined;
  if (session) {
    // non-admin users
    if (session.user.role !== 'ADMIN') {
      // attempted to access admin via callback
      if (decodedCb && decodedCb.startsWith('/admin')) {
        redirect('/account/error');
      }
      // otherwise, redirect to todo dashboard or callback if valid todo
      redirect('/todo');
    }
    // admin users: respect decoded callbackUrl or default to /admin
    redirect(decodedCb ?? '/admin');
  }
  return (
    <Template showHeader={false}>
      <Sign.ContactWrapper />
    </Template>
  );
}
