import { notFound } from 'next/navigation';
import * as Sign from '@/features/sign/templates/index';
import Template from '@/app/template';

export default function SignUpPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  return (
    <Template showHeader={false}>
      <Sign.ContactWrapper />
    </Template>
  );
}
