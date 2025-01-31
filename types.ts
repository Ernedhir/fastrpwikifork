export type WikiContentType = 'category' | 'page';

export interface BaseWikiContent {
  type: WikiContentType;
  name: string;
  description: string;
  slug: string;
  lastModified?: string;
  order?: number;
}

export interface WikiCategory extends BaseWikiContent {
  type: 'category';
}

export interface WikiPage extends BaseWikiContent {
  type: 'page';
  content?: string;
  categorySlug?: string;
}

export type WikiContent = WikiCategory | WikiPage;

export interface MetadataJson {
  content: WikiContent;
}

export interface GitHubRawContent {
  category?: WikiCategory;
  pages: WikiPage[];
}

export interface FetchWikiOptions {
  owner: string;
  repo: string;
  branch?: string;
  categorySlug?: string;
}
