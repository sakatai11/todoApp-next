import * as Header from '@/features/shared/templates/index';
import { getLinks } from '@/app/libs/markdown';
import { headers } from 'next/headers';

type TemplateProps = {
  children: React.ReactNode;
  showHeader?: boolean;
};

export default async function Template({
  children,
  showHeader,
}: TemplateProps) {
  if (!showHeader) {
    return <>{children}</>;
  }
  const { headerLinks } = await getLinks();
  // Forward incoming cookies so that internal API can authenticate the user
  // headers() may be async, so await its result before using .get()
  const incomingHeaders = await headers();
  const cookieHeader = incomingHeaders.get('cookie') || '';
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/user`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'cookie': cookieHeader,
    },
  });

  if (!response.ok) {
    console.error('Fetch error:', response.status, response.statusText);
    throw new Error('Failed to fetch data');
  }

  const { user } = await response.json();

  return (
    <>
      {showHeader && <Header.HeaderWrapper data={headerLinks} user={user} />}
      {children}
    </>
  );
}
