'use client';
import React, { useState, useRef, useEffect } from 'react';
import { LinkSection } from '@/types/markdown/markdownData';
import { UserData } from '@/types/auth/authData';
import HeadingContents from '@/features/shared/components/elements/heading/atoms/HeadingContents';
import IconContents from '@/features/shared/components/elements/Icon/IconContents';
import NavigationContents from '@/features/shared/components/elements/Navigation/NavigationContents';

type HeaderWrapperProps = {
  data: LinkSection[];
  user: UserData[];
};

export const HeaderWrapper: React.FC<HeaderWrapperProps> = ({ data, user }) => {
  const [showNav, setShowNav] = useState<boolean>(false);
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 外部クリックでナビゲーションを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalIsOpen) {
        return;
      }
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowNav(false);
      }
    };
    if (showNav) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNav, modalIsOpen]);

  // ヘッダーとナビゲーションリンクの分離
  const headingSection = data.find(
    (section) => section.title === 'ヘッディング',
  ) || {
    title: '',
    links: [],
  };

  const currentUser = user && user.length > 0 ? user[0] : undefined;
  if (!currentUser) return null;

  const initial = currentUser.email.charAt(0).toUpperCase();

  return (
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center relative">
        <HeadingContents headingSection={headingSection} />
        <div ref={containerRef}>
          {/* アイコンをクリックしてメニュー表示トグル */}
          <button
            type="button"
            onClick={() => setShowNav((prev) => !prev)}
            className="p-0 bg-transparent border-none focus:outline-none"
          >
            <IconContents initial={initial} />
          </button>
          {showNav && (
            <NavigationContents
              initial={initial}
              user={currentUser}
              modalIsOpen={modalIsOpen}
              setModalIsOpen={setModalIsOpen}
              onCloseNav={() => setShowNav(false)}
            />
          )}
        </div>
      </div>
    </header>
  );
};

export default HeaderWrapper;
