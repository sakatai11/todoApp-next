import { remark } from 'remark';
import html from 'remark-html';
import fs from 'fs';
import path from 'path';
import { LinkSection } from '@/types/markdown/markdownData';
// import matter from 'gray-matter';

export async function getLinks(): Promise<{
  headerLinks: LinkSection[];
  authLinks: LinkSection[];
}> {
  const fullPath = path.join(process.cwd(), 'data', 'links', 'links.md');
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  // Markdown をセクションごとに分ける（# ヘッダー, # ナビゲーションリンク）
  const sections = fileContents.split(/^#\s+/gm).filter(Boolean);

  // HTML からリンクを抽出
  const headerMarkdown = sections.find((s) => s.startsWith('ヘッダー')) ?? '';
  const authMarkdown =
    sections.find((s) => s.startsWith('認証コンテンツ')) ?? '';

  const convertToLinkSections = async (
    markdown: string,
  ): Promise<LinkSection[]> => {
    const processedContent = await remark().use(html).process(markdown);
    const contentHtml = processedContent.toString();

    const sections: LinkSection[] = [];
    let currentSection: LinkSection | null = null;

    const lines = contentHtml.split('\n');

    for (const line of lines) {
      if (line.startsWith('<h2>')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        const title = line.replace(/<\/?h2>/g, '').trim();
        currentSection = { title, links: [] };
      } else if (line.includes('<a ') && currentSection) {
        const hrefMatch = line.match(/href="([^"]+)"/);
        const nameMatch = line.match(/>([^<]+)</);

        if (hrefMatch && nameMatch) {
          currentSection.links.push({
            name: nameMatch[1].trim(),
            href: hrefMatch[1],
          });
        }
      }
    }
    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  };

  const headerLinks = await convertToLinkSections(headerMarkdown);
  const authLinks = await convertToLinkSections(authMarkdown);

  return { headerLinks, authLinks };
}
