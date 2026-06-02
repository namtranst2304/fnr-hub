import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { messages, conversationId } = await req.json();

    // 1. (Optional) Save user message to database
    if (conversationId) {
      await prisma.message.create({
        data: {
          conversationId,
          role: 'user',
          content: messages[messages.length - 1].content,
        },
      });
    }

    // 2. Proxy request to Python Backend (FastAPI) at the versioned URL
    const response = await fetch('http://localhost:8000/api/v1/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, model: 'llama3' }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to connect to AI backend' }, { status: 500 });
    }

    // 3. Stream the raw output back to Vercel AI SDK
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}
