
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
}

export interface Novel {
  id: string;
  title: string;
  description: string;
  cover_image: string | null;
  status: 'ongoing' | 'completed' | 'hiatus';
  author: Author;
  created_at: string;
  updated_at: string;
  genres: Genre[];
  tags: Tag[];
  chapters?: Chapter[];
  views?: number;
  bookmarks?: number;
  averageRating?: number;
  is_premium?: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  chapterNumber: number;
  chapter_number?: number;
  content?: string;
  views?: number;
  createdAt?: string;
  created_at?: string;
  isPremium?: boolean;
  is_premium?: boolean;
  coin_cost?: number;
  novel_id?: string;
  // Added reference_id for transactions
  reference_id?: string;
}
