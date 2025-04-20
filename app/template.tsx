import * as Header from '@/features/shared/templates/index';
import { getLinks } from '@/app/libs/markdown';

type TemplateProps = {
  children: React.ReactNode;
  showHeader?: boolean;
};

export default async function Template({
  children,
  showHeader,
}: TemplateProps) {
  const { headerLinks } = await getLinks();
  console.log(headerLinks);

  return (
    <>
      {showHeader && <Header.HeaderWrapper data={headerLinks} />}
      {children}
    </>
  );
}
