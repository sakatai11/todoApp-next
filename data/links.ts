type PageLink = {
  name: string;
  href: string;
};

/** Topのリンク */
export const topLink: PageLink = {
  name: 'Top',
  href: '/',
};
/** 各ページへのリンク */
export const pageLinks: PageLink[] = [
  {
    name: 'Todo',
    href: '/todo',
  }
];