'use client';

import { createClient } from '@/lib/supabase/client';
import { Message } from '@/types/booking';

interface ChatMessageBubbleProps {
  msg: Message;
  alignment: 'left' | 'right';
}

function getImageUrl(imagePath: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from('reference-images').getPublicUrl(imagePath);
  return data.publicUrl;
}

export function ChatMessageBubble({ msg, alignment }: ChatMessageBubbleProps) {
  const isRight = alignment === 'right';

  return (
    <div className={`flex ${isRight ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isRight
            ? 'bg-black text-white'
            : 'bg-zinc-100 text-zinc-800'
        }`}
      >
        {msg.image_path && (
          <a href={getImageUrl(msg.image_path)} target="_blank" rel="noopener noreferrer" className="block">
            <img
              src={getImageUrl(msg.image_path)}
              alt="Shared image"
              className="mb-2 max-h-60 rounded border border-zinc-200/20"
            />
          </a>
        )}
        {msg.body && <p className="text-sm">{msg.body}</p>}
        <p className={`mt-1 text-xs ${isRight ? 'text-zinc-400' : 'text-zinc-500'}`}>
          {new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
