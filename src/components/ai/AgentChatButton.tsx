import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import AgentChat from './AgentChat';

const AgentChatButton = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="fixed bottom-4 right-16 z-50">
        <Button
          size="icon"
          className="w-12 h-12 rounded-md shadow-lg"
          onClick={() => setOpen(true)}
          title="AI Agent"
        >
          <MessageSquare className="w-5 h-5" />
        </Button>
      </div>
      <AgentChat open={open} onOpenChange={setOpen} />
    </>
  );
};

export default AgentChatButton;


