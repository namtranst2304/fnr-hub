import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatArea } from '@/components/chat/ChatArea';

export default function ChatPage() {
  return (
    <div className="flex w-full h-screen overflow-hidden bg-white text-zinc-900 font-sans">
      <ChatSidebar />
      <ChatArea />
    </div>
  );
}
