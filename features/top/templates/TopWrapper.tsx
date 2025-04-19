import Link from 'next/link';
import { pageLinks } from '@/data/links';

const TopWrapper = () => {
  return (
    <div>
      {pageLinks.map(({ name, href }) => (
        <Link href={href} key={name}>
          {name}
        </Link>
      ))}
    </div>
  );
};

export default TopWrapper;
