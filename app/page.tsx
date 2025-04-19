import * as Top from '@/features/top/components';
import Template from '@/app/template';

export default function TopPage() {
  return (
    <Template showHeader={false}>
      <Top.TopNav />
    </Template>
  );
}
