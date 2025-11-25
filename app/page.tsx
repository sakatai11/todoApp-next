import * as Top from '@/features/top/templates/index';
import Template from '@/app/template';
import { getLinks } from '@/app/libs/markdown';

export default async function TopPage() {
  const { authLinks } = await getLinks();

  return (
    <Template showHeader={false}>
      <Top.TopWrapper data={authLinks} />
    </Template>
  );
}
