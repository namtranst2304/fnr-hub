import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CreatePostDto } from '@/lib/dto';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const validation = CreatePostDto.safeParse(data);
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const { originalText, rewrittenText } = validation.data;

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

