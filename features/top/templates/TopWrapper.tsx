import Link from 'next/link';
import { LinkSection } from '@/types/markdown/markdownData';

type TopWrapperProps = {
  data: LinkSection[];
};

const TopWrapper = ({ data }: TopWrapperProps) => {
  return (
    <div>
      {data.map((section, index) => (
        <div key={index} className="mb-4">
          <p className="text-lg font-bold mb-2">{section.title}</p>
          <div className="flex gap-4">
            {section.links.map(({ name, href }) => (
              <Link
                href={href}
                key={name}
                className="text-blue-500 hover:underline"
              >
                {name}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TopWrapper;
