import React from 'react';
import { LinkSection } from '@/types/markdown/markdownData';
import { UserData } from '@/types/auth/authData';
import HeadingContents from '@/features/shared/components/elements/Heading/HeadingContents';
import NavigationContents from '@/features/shared/components/elements/Navigation/NavigationContents';
import IconContents from '@/features/shared/components/elements/Icon/IconContents';

type HeaderWrapperProps = {
  data: LinkSection[];
  user: UserData[];
};

export const HeaderWrapper: React.FC<HeaderWrapperProps> = ({ data, user }) => {
  // ヘッダーセクションとナビゲーションセクションを分離
  const headingSection = data.find(
    (section) => section.title === 'ヘッディング',
  ) || { title: '', links: [] }; // デフォルト値を設定

  const navigationSection = data.find(
    (section) => section.title === 'ナビゲーション',
  ) || { title: '', links: [] }; // デフォルト値を設定;

  console.log('user', user);

  return (
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        {/* ヘッディングリンク */}
        <HeadingContents headingSection={headingSection} />

        <div className="flex items-center space-x-4">
          {/* ログインアイコン */}
          <IconContents />
          {/* ナビゲーションリンク */}
          <NavigationContents navigationSection={navigationSection} />
        </div>
      </div>
    </header>
  );
};

export default HeaderWrapper;
