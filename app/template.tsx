import * as Header from '@/features/shared/templates/index';
import { getLinks } from '@/app/libs/markdown';
import { fetchUserForTemplate } from '@/app/libs/fetchUserForTemplate';

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

  // モック環境対応のfetch関数を使用
  const { user } = await fetchUserForTemplate();

  return (
    <>
      {showHeader && <Header.HeaderWrapper data={headerLinks} user={user} />}
      {children}
    </>
  );
}
