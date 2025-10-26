
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
import { Checkbox } from '@/components/ui/checkbox';
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
  status: 'ongoing' | 'completed' | 'hiatus';
  genres: Genre[];
  tags: Tag[];
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
  }, [toast]);

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
    
    // Fetch available genres
    const fetchGenres = async () => {
      const { data, error } = await supabase
        .from('genres')
        .select('id, name');
      
      if (error) {
        console.error('Error fetching genres:', error);
        return;
      }
      
      if (data) {
        setAvailableGenres(data);
      }
    };
    
    fetchGenres();
  }, [user, navigate, toast]);
  
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setCoverImageUrl(URL.createObjectURL(file));
    }
  };

  const uploadCoverImage = async (novelId: string, file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${novelId}.${fileExt}`;
    const filePath = `novels/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('covers')
      .upload(filePath, file, { upsert: true });
    
    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw uploadError;
    }
    
    const { data } = supabase.storage
      .from('covers')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  };
  
  const onSubmit = async (data: NovelFormData) => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Create novel with initial values
      const { data: novel, error } = await supabase
        .from('novels')
        .insert({
          title: data.title,
          description: data.description,
          status: status, // Use the status state variable directly
          author_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Handle cover image upload if selected
      if (coverImage) {
        try {
          const imageUrl = await uploadCoverImage(novel.id, coverImage);
          
          // Update novel with cover image URL
          const { error: updateError } = await supabase
            .from('novels')
            .update({ cover_image: imageUrl })
            .eq('id', novel.id);
          
          if (updateError) {
            console.error('Error updating novel with cover image:', updateError);
          }
        } catch (uploadError) {
          console.error('Error during image upload:', uploadError);
          // Continue with novel creation even if image upload fails
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
        }
      }
      
      toast({
        title: "Novel created!",
        description: "Your novel has been successfully created.",
      });
      
      navigate(`/author/novels/${novel.id}/edit`);
    } catch (error) {
      console.error('Error creating novel:', error);
      toast({
        title: "Error",
        description: "There was an error creating your novel. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  


  if (!user) {
    return null; // Will redirect in useEffect
  }
  function handleGenreChange(id: string, checked: boolean): void {
    const genre = availableGenres.find(g => g.id === id);
    if (!genre) return;

    setSelectedGenres(prev => {
      if (checked) {
        // add if not already present
        if (prev.some(g => g.id === id)) return prev;
        return [...prev, genre];
      } else {
        // remove if present
        return prev.filter(g => g.id !== id);
      }
    });
  } return (
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
