import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAiDecomposeEpic, DecomposedStory } from '@/hooks/useAiEpic';

interface EpicDecomposerProps {
  epicId: string;
  epicName: string;
  onStoriesCreated?: () => void;
}

export function EpicDecomposer({ epicId, epicName, onStoriesCreated }: EpicDecomposerProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [expandedStory, setExpandedStory] = useState<number | null>(null);
  const decomposeMutation = useAiDecomposeEpic();

  const handleDecompose = () => {
    decomposeMutation.mutate({ epicId, description });
  };

  const data = decomposeMutation.data;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <Sparkles className="h-3.5 w-3.5" /> AI Decompose
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" /> Decompose Epic
            </DialogTitle>
            <DialogDescription>
              AI will break "{epicName}" into user stories with acceptance criteria and estimates.
            </DialogDescription>
          </DialogHeader>

          {!data ? (
            <div className="space-y-4 py-4">
              <Textarea
                placeholder="Describe what this epic should accomplish in detail. The more context you provide, the better the AI can decompose it into stories..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={5}
              />
              <Button onClick={handleDecompose} disabled={decomposeMutation.isPending || !description.trim()} className="w-full gap-2">
                <Sparkles className="h-4 w-4" />
                {decomposeMutation.isPending ? 'Decomposing...' : 'Generate Stories'}
              </Button>
            </div>
          ) : data.error ? (
            <div className="py-8 text-center text-sm text-muted-foreground">{data.error}</div>
          ) : (
            <>
              <div className="flex items-center gap-4 py-2 border-b">
                <Badge variant="outline">{data.stories.length} Stories</Badge>
                <Badge variant="outline">{data.totalPoints} Total Points</Badge>
                <Badge variant="outline">~{data.estimatedSprints} Sprints</Badge>
              </div>

              <ScrollArea className="flex-1 max-h-[50vh]">
                <div className="space-y-2 pr-4">
                  {data.stories.map((story: DecomposedStory, i: number) => (
                    <Card key={i} className="cursor-pointer" onClick={() => setExpandedStory(expandedStory === i ? null : i)}>
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          {expandedStory === i ? <ChevronDown className="h-4 w-4 mt-0.5" /> : <ChevronRight className="h-4 w-4 mt-0.5" />}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{story.title}</span>
                              <Badge variant="outline" className="text-[10px]">{story.storyPoints} pts</Badge>
                              <Badge variant={story.priority === 'high' || story.priority === 'critical' ? 'destructive' : 'secondary'} className="text-[10px]">
                                {story.priority}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">Sprint {story.suggestedSprint}</Badge>
                            </div>
                            {expandedStory === i && (
                              <div className="mt-2 space-y-2 text-xs">
                                <p className="text-muted-foreground">{story.description}</p>
                                <div>
                                  <div className="font-medium mb-1">Acceptance Criteria:</div>
                                  <p className="text-muted-foreground whitespace-pre-wrap">{story.acceptanceCriteria}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              <DialogFooter className="pt-2">
                <Button variant="outline" onClick={() => { decomposeMutation.reset(); setDescription(''); }}>
                  Regenerate
                </Button>
                <Button onClick={() => { onStoriesCreated?.(); setOpen(false); }} className="gap-2">
                  <Plus className="h-4 w-4" /> Create All Stories
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
