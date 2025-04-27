import React from 'react';
import { LinkSection } from '@/types/markdown/markdownData';
import Link from 'next/link';

type NavigationContentsProps = {
  navigationSection: LinkSection;
};

export const NavigationContents: React.FC<NavigationContentsProps> = ({
  navigationSection,
}) => {
  return (
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
  );
};

export default NavigationContents;
