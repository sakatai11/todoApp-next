import * as Top from '@/features/top/templates/index';
import Template from '@/app/template';

export default function TopPage() {
  return (
    <Template showHeader={false}>
      <Top.TopWrapper />
    </Template>
  );
}
