import React from 'react';
import { LinkSection } from '@/types/markdown/markdownData';
import Link from 'next/link';

type HeadingContentsProps = {
  headingSection: LinkSection;
};

export const HeadingContents: React.FC<HeadingContentsProps> = ({
  headingSection,
}) => {
  return (
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
  );
};

export default HeadingContents;
