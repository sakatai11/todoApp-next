import React, { memo } from 'react';

// Props for the icon component: display the initial of the user
type IconContentsProps = {
  initial: string;
};

const IconContents: React.FC<IconContentsProps> = ({ initial }) => {
  return (
    <div className="w-10 h-10 bg-white text-blue-600 rounded-full flex items-center justify-center">
      <span className="font-bold">{initial}</span>
    </div>
  );
};

export default memo(IconContents);
