
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

interface QueryResult {
  recent: Novel[];
  all: Novel[];
}

const fetchNovels = async (): Promise<QueryResult> => {
  try {
    const [recentQuery, allQuery] = await Promise.all([
      supabase
        .from('novels')
        .select(`
          id,
          title,
          description,
          cover_image,
          author_id,
          status,
          created_at,
          updated_at,
          views,
          rating,
          author:profiles!author_id(
            id,
            username,
            display_name
          ),
          novel_genres(
            genres(*)
          ),
          novel_tags(
            tags(*)
          ),
          ratings(rating)
        `)
        .order('updated_at', { ascending: false })
        .limit(30),
      
      supabase
        .from('novels')
        .select(`
          id,
          title,
          description,
          cover_image,
          author_id,
          status,
          created_at,
          updated_at,
          views,
          rating,
          author:profiles!author_id(
            id,
            username,
            display_name
          ),
          novel_genres(
            genres(*)
          ),
          novel_tags(
            tags(*)
          ),
          ratings(rating)
        `)
        .order('created_at', { ascending: false })
        .limit(30)
    ]);

    if (recentQuery.error) throw recentQuery.error;
    if (allQuery.error) throw allQuery.error;

    const processNovels = (novels: any[]): Novel[] => 
      novels.map(novel => ({
        id: novel.id,
        title: novel.title,
        description: novel.description || '',
        cover_image: novel.cover_image || '/placeholder.svg',
        author: novel.author?.display_name || novel.author?.username || 'Unknown Author',
        author_id: novel.author?.id,
        status: novel.status as "Ongoing" | "Completed" | "Hiatus",
        created_at: novel.created_at,
        updated_at: novel.updated_at,
        views: novel.views || 0,
        rating: novel.ratings?.length > 0
          ? novel.ratings.reduce((acc: number, curr: any) => acc + (curr.rating || 0), 0) / novel.ratings.length
          : 0,
        genres: novel.novel_genres?.map((ng: any) => ng.genres).filter(Boolean) || [],
        tags: novel.novel_tags?.map((nt: any) => nt.tags).filter(Boolean) || [],
        chapters: []
      }));

    return {
      recent: processNovels(recentQuery.data || []),
      all: processNovels(allQuery.data || [])
    };
  } catch (error) {
    console.error('Error fetching novels:', error);
    throw error;
  }
};

const Browse = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const { data: novels, isLoading, error } = useQuery<QueryResult>({
    queryKey: ['novels'],
    queryFn: fetchNovels
  });

  const getFilteredNovels = (novelList: Novel[] = []) => {
    return novelList.filter(novel => 
      novel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      novel.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      novel.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

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
                  {getFilteredNovels(novels?.recent).map((novel) => (
                    <NovelCard key={novel.id} novel={novel} />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="all">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {getFilteredNovels(novels?.all).map((novel) => (
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

export default Browse;
