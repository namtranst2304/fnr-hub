import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ScheduleFbPostDto } from '@/lib/dto';

export async function POST(req: Request) {
  try {
    // 1. Receive and validate data using DTO
    const body = await req.json();
    const validation = ScheduleFbPostDto.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const { postId, scheduledTime, rewrittenText } = validation.data; 

    // Update text if the user modified it in the Modal
    if (rewrittenText) {
      await prisma.post.update({
        where: { id: postId },
        data: { rewrittenText }
      });
    }

    // 2. Get AI-rewritten post from Database
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post || !post.rewrittenText) {
      return NextResponse.json({ error: "Post does not exist or has not been processed by AI" }, { status: 400 });
    }

    // 3. Convert time to Facebook's Unix Timestamp (Seconds)
    // JavaScript default is milliseconds, so divide by 1000
    const publishTimestamp = Math.floor(new Date(scheduledTime).getTime() / 1000);

    // 4. Call Facebook Graph API
    const PAGE_ID = process.env.FACEBOOK_PAGE_ID;
    const ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
    
    const fbResponse = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: post.rewrittenText,
        published: 'false', // Important: Set to false so FB holds it until the scheduled time
        scheduled_publish_time: publishTimestamp,
        access_token: ACCESS_TOKEN
      }),
    });

    const fbData = await fbResponse.json();

    if (fbData.error) {
      console.error("Facebook API Error:", fbData.error);
      return NextResponse.json({ error: fbData.error.message }, { status: 400 });
    }

    // 5. Update Database: Change status and save Facebook ID
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: 'SCHEDULED',
        scheduledAt: new Date(scheduledTime),
        fbPostId: fbData.id // Save this ID for management
      }
    });

    return NextResponse.json({ success: true, fbPostId: fbData.id });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

