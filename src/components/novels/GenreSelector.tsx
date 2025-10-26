import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Genre {
  id: string;
  name: string;
}

interface GenreSelectorProps {
  selectedGenres: Genre[];
  availableGenres: Genre[];
  onChange: (genres: Genre[]) => void;
}

const GenreSelector = ({ selectedGenres, availableGenres, onChange }: GenreSelectorProps) => {
  const [open, setOpen] = React.useState(false);

  const toggleGenre = (genre: Genre) => {
    const isSelected = selectedGenres.some((g) => g.id === genre.id);
    if (isSelected) {
      onChange(selectedGenres.filter((g) => g.id !== genre.id));
    } else {
      onChange([...selectedGenres, genre]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between"
          >
            Select genres...
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search genres..." />
            <CommandEmpty>No genre found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {availableGenres.map((genre) => (
                <CommandItem
                  key={genre.id}
                  onSelect={() => toggleGenre(genre)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedGenres.some((g) => g.id === genre.id)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {genre.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="flex flex-wrap gap-2">
        {selectedGenres.map((genre) => (
          <Badge
            key={genre.id}
            variant="secondary"
            className="cursor-pointer"
            onClick={() => toggleGenre(genre)}
          >
            {genre.name}
            <span className="ml-1">×</span>
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default GenreSelector;