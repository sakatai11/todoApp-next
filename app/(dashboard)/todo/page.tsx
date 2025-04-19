import * as Top from '@/features/top/templates/index';
import Template from '@/app/template';
export default async function TodoPage() {
  return (
    <Template showHeader={true}>
      <Top.TopWrapper />
    </Template>
  );
}
