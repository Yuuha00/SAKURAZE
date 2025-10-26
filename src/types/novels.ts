
export interface Author {
  id: string;
  username: string;
  display_name: string | null;
}

export interface Genre {
  id: string;
  name: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Chapter {
  id: string;
  title: string;
  chapter_number: number;
  novel_id: string;
  is_premium: boolean;
  coin_cost: number;
  views: number;
  content: string;
  created_at: string;
  updated_at: string;
  reference_id?: string;
}

export interface Novel {
  id: string;
  title: string;
  description: string;
  cover_image: string;
  author: string;
  author_id: string;
  status: "Ongoing" | "Completed" | "Hiatus";
  created_at: string;
  updated_at: string;
  views: number;
  rating: number;
  bookmarks?: number;
  genres: Genre[];
  tags: Tag[];
  chapters: Chapter[];
}

export interface NovelWithAuthor extends Omit<Novel, 'author'> {
  author: Author;
}

export interface NovelWithRelations extends NovelWithAuthor {
  novel_genres: { genres: Genre }[];
  novel_tags: { tags: Tag }[];
  ratings: { rating: number }[];
  count?: number;
}
