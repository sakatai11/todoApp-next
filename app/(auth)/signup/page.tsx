import * as Sign from '@/features/sign/templates/index';
import Template from '@/app/template';

export default function SignUpPage() {
  return (
    <Template showHeader={false}>
      <Sign.ContactWrapper />
    </Template>
  );
}
