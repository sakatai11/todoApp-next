'use client';
import * as Header from '@/features/shared/templates/index';

type TemplateProps = {
  children: React.ReactNode;
  showHeader?: boolean;
};

export default function Template({ children, showHeader }: TemplateProps) {
  console.log(`${showHeader}:showHeader`);

  return (
    <>
      {showHeader && <Header.HeaderWrapper />}
      {children}
    </>
  );
}
