'use client';

import dynamic from 'next/dynamic';
import { LinkSection } from '@/types/markdown/markdownData';
import { UserData } from '@/types/auth/authData';

const HeaderWrapper = dynamic(
  () => import('@/features/shared/components/elements/heading/HeaderWrapper'),
  { ssr: false },
);

type ClientWrapperProps = {
  data: LinkSection[];
  user: UserData[];
};

export const ClientWrapper: React.FC<ClientWrapperProps> = ({ data, user }) => {
  return <HeaderWrapper data={data} user={user} />;
};

export default ClientWrapper;
