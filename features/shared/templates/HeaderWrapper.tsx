'use client';
import React, { useState } from 'react';
// import { signOut } from 'next-auth/react';
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
  // ナビゲーション表示のトグル制御
  const [showNav, setShowNav] = useState<boolean>(false);

  // ヘッダーセクションとナビゲーションセクションを分離
  const headingSection = data.find(
    (section) => section.title === 'ヘッディング',
  ) || { title: '', links: [] }; // デフォルト値を設定

  // 環境から取得したユーザーデータ（配列）は一件
  const currentUser = user && user.length > 0 ? user[0] : undefined;

  // ユーザーが存在しない場合は何も表示しない
  if (!currentUser) {
    return null; // ユーザーが存在しない場合は何も表示しない
  }

  // アイコンに表示する先頭文字（email）
  const initial = currentUser.email.charAt(0).toUpperCase();

  return (
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center relative">
        {/* ヘッディングリンク */}
        <HeadingContents headingSection={headingSection} />

        <div>
          {/* ログインアイコン：クリックでメニュー表示トグル */}
          <button
            onClick={() => setShowNav((prev) => !prev)}
            type="button"
            className="p-0 bg-transparent border-none focus:outline-none"
          >
            <IconContents initial={initial} />
          </button>
          {/* ユーザーメニュー：アイコン・メール・サインアウト */}
          {showNav && (
            <>
              {/* ナビゲーション内 */}
              <NavigationContents initial={initial} user={currentUser} />
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default HeaderWrapper;
