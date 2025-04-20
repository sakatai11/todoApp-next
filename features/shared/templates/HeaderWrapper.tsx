import React from 'react';
import { LinkSection } from '@/types/markdown/markdownData';
import Link from 'next/link';

type HeaderWrapperProps = {
  data: LinkSection[];
};

export const HeaderWrapper: React.FC<HeaderWrapperProps> = ({ data }) => {
  // ヘッダーセクションとナビゲーションセクションを分離
  const headingSection = data.find(
    (section) => section.title === 'ヘッディング',
  );
  const navigationSection = data.find(
    (section) => section.title === 'ナビゲーション',
  );

  return (
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">
          {/* ヘッディングリンク */}
          {headingSection?.links?.map((link, index) => (
            <Link
              key={`dashboard-${index}`}
              href={link.href}
              className="hover:underline"
            >
              {link.name}
            </Link>
          ))}
        </h1>
        <nav>
          <ul className="flex space-x-4">
            {/* ナビゲーションリンク */}
            {navigationSection?.links?.map((link, index) => (
              <li key={`nav-${index}`}>
                <Link href={link.href} className="hover:underline">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default HeaderWrapper;
