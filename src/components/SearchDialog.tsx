import React, { useState, useEffect } from 'react';
import { Search, User, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  type: 'skill' | 'user';
  id: string;
  name: string;
  category?: string;
  description?: string;
  avatar_url?: string;
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchDelay = setTimeout(async () => {
      setLoading(true);
      try {
        // Search skills
        const { data: skills } = await supabase
          .from('skills')
          .select('*')
          .ilike('name', `%${query}%`)
          .limit(5);

        // Search users
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
          .limit(5);

        const searchResults: SearchResult[] = [
          ...(skills || []).map(skill => ({
            type: 'skill' as const,
            id: skill.id,
            name: skill.name,
            category: skill.category,
            description: skill.description
          })),
          ...(profiles || []).map(profile => ({
            type: 'user' as const,
            id: profile.id,
            name: profile.full_name,
            description: profile.bio,
            avatar_url: profile.avatar_url
          }))
        ];

        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchDelay);
  }, [query]);

  const handleClose = () => {
    setQuery('');
    setResults([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search Skills & Users</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search for skills or users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {loading && (
            <div className="text-center py-4 text-muted-foreground">
              Searching...
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result) => (
                <Button
                  key={`${result.type}-${result.id}`}
                  variant="ghost"
                  className="w-full justify-start h-auto p-4"
                  onClick={handleClose}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className="flex-shrink-0">
                      {result.type === 'skill' ? (
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {result.avatar_url ? (
                            <img src={result.avatar_url} alt={result.name} className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 text-left">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{result.name}</span>
                        {result.type === 'skill' && result.category && (
                          <Badge variant="secondary" className="text-xs">
                            {result.category}
                          </Badge>
                        )}
                      </div>
                      {result.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {result.description}
                        </p>
                      )}
                    </div>
                    
                    <Badge variant="outline" className="text-xs">
                      {result.type}
                    </Badge>
                  </div>
                </Button>
              ))}
            </div>
          )}

          {query && !loading && results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No results found for "{query}"</p>
              <p className="text-sm">Try searching for different skills or usernames</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}