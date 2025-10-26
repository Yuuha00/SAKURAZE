import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Container from '@/components/common/Container';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload } from 'lucide-react';
import GenreSelector from '@/components/novels/GenreSelector';
import TagSelector from '@/components/novels/TagSelector';

interface Genre {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

interface NovelFormData {
  title: string;
  description: string;
}

const CreateNovel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');
  const [status, setStatus] = useState<'ongoing' | 'completed' | 'hiatus'>('ongoing');
  
  const { register, handleSubmit, formState: { errors } } = useForm<NovelFormData>();

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      toast({
        title: "Authentication required",
        description: "You need to be logged in to create a novel",
        variant: "destructive"
      });
      return;
    }

    const fetchGenresAndTags = async () => {
      try {
        const [genresResponse, tagsResponse] = await Promise.all([
          supabase.from('genres').select('*').order('name'),
          supabase.from('tags').select('*').order('name')
        ]);

        if (genresResponse.error) throw genresResponse.error;
        if (tagsResponse.error) throw tagsResponse.error;

        setAvailableGenres(genresResponse.data);
        setAvailableTags(tagsResponse.data);
      } catch (error) {
        console.error('Error fetching genres and tags:', error);
        toast({
          title: 'Error',
          description: 'Failed to load genres and tags',
          variant: 'destructive',
        });
      }
    };

    fetchGenresAndTags();
  }, [user, navigate, toast]);

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast({
          title: "Error",
          description: "Image size should be less than 5MB",
          variant: "destructive"
        });
        return;
      }
      setCoverImage(file);
      setCoverImageUrl(URL.createObjectURL(file));
    }
  };

  const uploadCoverImage = async (novelId: string, file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${novelId}.${fileExt}`;
      const filePath = `novels/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('covers')
        .getPublicUrl(filePath);
      
      if (!data.publicUrl) throw new Error('Failed to get public URL');
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error in uploadCoverImage:', error);
      throw error;
    }
  };

  const onSubmit = async (data: NovelFormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a novel",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedGenres.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one genre",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create the novel first
      const { data: novel, error: novelError } = await supabase
        .from('novels')
        .insert({
          title: data.title,
          description: data.description,
          status: status,
          author_id: user.id,
          cover_image: null,
          views: 0,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (novelError) {
        console.error('Error creating novel:', novelError);
        throw novelError;
      }

      // Upload cover image if selected
      if (coverImage) {
        try {
          const uploadedUrl = await uploadCoverImage(novel.id, coverImage);
          
          const { error: coverUpdateError } = await supabase
            .from('novels')
            .update({ 
              cover_image: uploadedUrl,
              updated_at: new Date().toISOString()
            })
            .eq('id', novel.id);
          
          if (coverUpdateError) {
            console.error('Error updating cover image:', coverUpdateError);
            toast({
              title: "Warning",
              description: "Cover image update failed. You can add it later.",
              variant: "destructive"
            });
          }
        } catch (uploadError) {
          console.error('Error uploading cover image:', uploadError);
          toast({
            title: "Warning",
            description: "Novel created but cover image upload failed. You can add it later.",
            variant: "default"
          });
        }
      }
      
      // Add genres
      if (selectedGenres.length > 0) {
        const genreInserts = selectedGenres.map(genre => ({
          novel_id: novel.id,
          genre_id: genre.id
        }));
        
        const { error: genreError } = await supabase
          .from('novel_genres')
          .insert(genreInserts);
          
        if (genreError) {
          console.error('Error adding genres:', genreError);
          toast({
            title: "Warning",
            description: "Novel created but genre assignment failed. Please try updating them later.",
            variant: "default"
          });
        }
      }
      
      // Add tags
      if (selectedTags.length > 0) {
        const tagInserts = selectedTags.map(tag => ({
          novel_id: novel.id,
          tag_id: tag.id
        }));
        
        const { error: tagError } = await supabase
          .from('novel_tags')
          .insert(tagInserts);
          
        if (tagError) {
          console.error('Error adding tags:', tagError);
          toast({
            title: "Warning",
            description: "Novel created but tag assignment failed. Please try updating them later.",
            variant: "default"
          });
        }
      }
      
      toast({
        title: "Success",
        description: "Your novel has been created successfully!",
      });
      
      navigate(`/author/novels/${novel.id}/edit`);
    } catch (error: any) {
      console.error('Error creating novel:', error);
      toast({
        title: "Error",
        description: error.message || "There was an error creating your novel. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <Container>
      <div className="py-10">
        <h1 className="text-3xl font-bold mb-6">Create a New Novel</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Novel Details</CardTitle>
            <CardDescription>
              Fill in the details of your new novel below
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter your novel's title"
                  {...register("title", { required: true })}
                />
                {errors.title && <p className="text-sm text-red-500">Title is required</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter a description for your novel"
                  rows={5}
                  {...register("description", { required: true })}
                />
                {errors.description && <p className="text-sm text-red-500">Description is required</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="coverImage">Cover Image</Label>
                <div className="flex items-center gap-4">
                  {coverImageUrl && (
                    <div className="relative w-24 h-32 bg-muted rounded-md overflow-hidden">
                      <img 
                        src={coverImageUrl} 
                        alt="Cover preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <label 
                      htmlFor="cover-upload" 
                      className="flex items-center justify-center w-full h-24 border-2 border-dashed border-muted-foreground/25 rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col items-center space-y-2 text-muted-foreground">
                        <Upload className="h-6 w-6" />
                        <span className="text-sm">Click to upload cover image</span>
                      </div>
                      <input 
                        type="file" 
                        id="cover-upload"
                        className="hidden" 
                        accept="image/*"
                        onChange={handleCoverImageChange}
                      />
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended size: 800x1200 pixels. Max size: 5MB
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="genres">Genres</Label>
                <GenreSelector
                  selectedGenres={selectedGenres}
                  availableGenres={availableGenres}
                  onChange={setSelectedGenres}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <TagSelector
                  selectedTags={selectedTags}
                  availableTags={availableTags}
                  onChange={setSelectedTags}
                  onCreateTag={async (tagName) => {
                    const { data, error } = await supabase
                      .from('tags')
                      .insert({ name: tagName })
                      .select()
                      .single();
                    
                    if (error) {
                      toast({
                        title: 'Error',
                        description: 'Failed to create tag',
                        variant: 'destructive',
                      });
                      return null;
                    }
                    
                    setAvailableTags(prev => [...prev, data]);
                    return data;
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  defaultValue="ongoing"
                  onValueChange={(value) => setStatus(value as 'ongoing' | 'completed' | 'hiatus')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="hiatus">Hiatus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Novel"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Container>
  );
};

export default CreateNovel;