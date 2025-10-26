import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Tag {
  id: string;
  name: string;
}

interface TagSelectorProps {
  selectedTags: Tag[];
  availableTags: Tag[];
  onChange: (tags: Tag[]) => void;
  onCreateTag?: (tagName: string) => Promise<Tag>;
}

const TagSelector = ({ selectedTags, availableTags, onChange, onCreateTag }: TagSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [newTag, setNewTag] = useState('');

  const toggleTag = (tag: Tag) => {
    const isSelected = selectedTags.some((t) => t.id === tag.id);
    if (isSelected) {
      onChange(selectedTags.filter((t) => t.id !== tag.id));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const handleCreateTag = async () => {
    if (newTag.trim() && onCreateTag) {
      const tag = await onCreateTag(newTag.trim());
      if (tag) {
        toggleTag(tag);
        setNewTag('');
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="justify-between"
            >
              Select tags...
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search tags..." />
              <CommandEmpty>
                {onCreateTag && (
                  <div className="p-2">
                    <p className="text-sm text-muted-foreground">Tag not found. Create new tag:</p>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Enter new tag name"
                      />
                      <Button onClick={handleCreateTag} disabled={!newTag.trim()}>
                        Add
                      </Button>
                    </div>
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {availableTags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    onSelect={() => toggleTag(tag)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedTags.some((t) => t.id === tag.id)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {tag.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="cursor-pointer"
            onClick={() => toggleTag(tag)}
          >
            {tag.name}
            <span className="ml-1">×</span>
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default TagSelector;