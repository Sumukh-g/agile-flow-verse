import React, { useState } from 'react';
import { Search, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNaturalLanguageQuery, NLQueryResult } from '@/hooks/useAiEpic';

interface NaturalLanguageQueryProps {
  projectId: string;
}

export function NaturalLanguageQuery({ projectId }: NaturalLanguageQueryProps) {
  const [query, setQuery] = useState('');
  const queryMutation = useNaturalLanguageQuery();

  const handleQuery = () => {
    if (!query.trim()) return;
    queryMutation.mutate({ projectId, query: query.trim() });
  };

  const data = queryMutation.data;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder='Ask anything... e.g. "Which epics are at risk?"'
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleQuery()}
            className="pl-9"
          />
        </div>
        <Button onClick={handleQuery} disabled={queryMutation.isPending || !query.trim()} className="gap-2">
          {queryMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Ask AI
        </Button>
      </div>

      {data && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            {data.error ? (
              <p className="text-sm text-muted-foreground">{data.error}</p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{data.model}</Badge>
                  <span className="text-xs text-muted-foreground">{data.resultCount} results</span>
                </div>
                {data.explanation && (
                  <p className="text-sm text-muted-foreground">{data.explanation}</p>
                )}
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-2">
                    {data.results.map((result: any, i: number) => (
                      <div key={i} className="p-2 rounded border text-sm">
                        <div className="font-medium">{result.title || result.name || result.id}</div>
                        {result.status && <Badge variant="outline" className="text-[10px] mt-1">{result.status}</Badge>}
                        {result.storyPoints != null && <Badge variant="outline" className="text-[10px] mt-1 ml-1">{result.storyPoints} pts</Badge>}
                        {result.priority && <Badge variant="outline" className="text-[10px] mt-1 ml-1">{result.priority}</Badge>}
                        {result.riskLevel && <Badge variant={result.riskLevel === 'critical' ? 'destructive' : 'secondary'} className="text-[10px] mt-1 ml-1">{result.riskLevel}</Badge>}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
