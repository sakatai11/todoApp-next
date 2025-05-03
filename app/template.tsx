import * as Header from '@/features/shared/templates/index';
import { getLinks } from '@/app/libs/markdown';
import { auth } from '@/auth';
import { getApiRequest } from '@/app/libs/apis';

type TemplateProps = {
  children: React.ReactNode;
  showHeader?: boolean;
};

export default async function Template({
  children,
  showHeader,
}: TemplateProps) {
  const { headerLinks } = await getLinks();

  const session = await auth();
  const { user } = await getApiRequest(session); // セッションを引数に渡す

  return (
    <>
      {showHeader && <Header.HeaderWrapper data={headerLinks} user={user} />}
      {children}
    </>
  );
}
