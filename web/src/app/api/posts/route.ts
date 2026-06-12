import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { originalText, rewrittenText } = data;

    if (!originalText) {
      return NextResponse.json({ error: 'Missing originalText' }, { status: 400 });
    }

    const newPost = await prisma.post.create({
      data: {
        sourcePostId: `custom_gen_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        originalText,
        rewrittenText,
        status: 'REWRITTEN', // Ready to be scheduled
      },
    });

    return NextResponse.json({ success: true, post: newPost });
  } catch (error: any) {
    console.error('Failed to create custom post:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
