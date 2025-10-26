
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Novel } from '@/types/novels';
import { supabase } from '@/integrations/supabase/client';
import Container from '@/components/common/Container';
import NovelCard from '@/components/novels/NovelCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface NovelWithRelations extends Novel {
  novel_genres: { genre: any }[];
  novel_tags: { tag: any }[];
  ratings: { rating: number }[];
}

interface QueryResult {
  recent: NovelWithRelations[];
  all: NovelWithRelations[];
}

const fetchNovels = async (): Promise<QueryResult> => {
  const recentQuery = supabase
    .from('novels')
    .select(`
      id,
      title,
      description,
      cover_image,
      status,
      created_at,
      updated_at,
      author:profiles(id, username, display_name),
      novel_genres(
        genre:genres(*)
      ),
      novel_tags(
        tag:tags(*)
      ),
      ratings(rating)
    `)
    .order('updated_at', { ascending: false })
    .limit(30);

  const allQuery = supabase
    .from('novels')
    .select(`
      id,
      title,
      description,
      cover_image,
      status,
      created_at,
      updated_at,
      author:profiles(id, username, display_name),
      novel_genres(
        genre:genres(*)
      ),
      novel_tags(
        tag:tags(*)
      ),
      ratings(rating)
    `)
    .order('created_at', { ascending: false })
    .limit(30);

  const [recentResult, allResult] = await Promise.all([recentQuery, allQuery]);

  if (recentResult.error) throw recentResult.error;
  if (allResult.error) throw allResult.error;

  const processNovels = (novels: any[]) => novels.map(novel => ({
    ...novel,
    genres: novel.novel_genres?.map((ng: any) => ng.genre) || [],
    tags: novel.novel_tags?.map((nt: any) => nt.tag) || [],
    averageRating: novel.ratings?.length > 0
      ? novel.ratings.reduce((acc: number, curr: any) => acc + (curr.rating || 0), 0) / novel.ratings.length
      : 0
  }));

  return {
    recent: processNovels(recentResult.data || []),
    all: processNovels(allResult.data || [])
  };

const fetchNovels = async () => {
  const [recent, all] = await Promise.all([
    fetchRecentNovels(),
    fetchAllNovels()
  ]);

  return {
    recent,
    all
  };
};

const processNovel = (novel: any) => ({
    id: novel.id,
    title: novel.title,
    author: novel.author.display_name || novel.author.username,
    authorId: novel.author_id,
    coverImage: novel.cover_image || 'https://picsum.photos/800/1200',
    description: novel.description || '',
    rating: novel.rating || 0,
    views: novel.views || 0,
    bookmarks: novel.bookmarks || 0,
    genres: novel.novel_genres?.map((ng: any) => ng.genres.name) || [],
    status: novel.status,
    chapterCount: novel.chapters?.[0]?.count || 0
  }));
};

const Browse = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const { data: novels, isLoading, error } = useQuery<QueryResult>({
    queryKey: ['novels'],
    queryFn: fetchNovels
  });

  const filteredNovels = novels?.filter(novel => 
    novel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    novel.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    novel.genres.some(genre => genre.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Container>
      <div className="py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Browse Novels</h1>
          <p className="text-muted-foreground mt-2">
            Discover new stories to read
          </p>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search novels..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <Button variant="outline">
            Filter
          </Button>
        </div>

        <Tabs defaultValue="recent" className="space-y-6">
          <TabsList>
            <TabsTrigger value="recent">Recently Updated</TabsTrigger>
            <TabsTrigger value="all">All Novels</TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-red-500">Error loading novels</p>
            </div>
          ) : (
            <>
              <TabsContent value="recent">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {novels?.recent
                    .filter(novel => 
                      novel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      novel.description?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((novel) => (
                      <NovelCard key={novel.id} novel={novel} />
                    ))}
                </div>
              </TabsContent>
              
              <TabsContent value="all">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {novels?.all
                    .filter(novel => 
                      novel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      novel.description?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((novel) => (
                      <NovelCard key={novel.id} novel={novel} />
                    ))}
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </Container>
  );
};

const renderNovelGrid = (novels: any[] | undefined, isLoading: boolean, error: Error | null) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
          <div key={i} className="flex flex-col space-y-2">
            <Skeleton className="w-full h-64 rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex space-x-2">
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium text-red-500">Error loading novels</h3>
        <p className="text-muted-foreground mt-2">Please try again later</p>
      </div>
    );
  }
  
  if (!novels || novels.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium">No novels found</h3>
        <p className="text-muted-foreground mt-2">Try a different search or check back later</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {novels.map(novel => (
        <NovelCard
          key={novel.id}
          id={novel.id}
          title={novel.title}
          author={novel.author}
          coverImage={novel.coverImage}
          rating={novel.rating}
          genres={novel.genres}
          views={novel.views}
          bookmarks={novel.bookmarks}
        />
      ))}
    </div>
  );
};

export default Browse;
