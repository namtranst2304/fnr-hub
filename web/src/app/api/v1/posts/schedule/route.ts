import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { content, scheduledAt } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // 1. Convert datetime to timestamp if scheduledAt is provided
    let publishTimestamp = null;
    let scheduledDateObj = null;

    if (scheduledAt) {
      scheduledDateObj = new Date(scheduledAt);
      publishTimestamp = Math.floor(scheduledDateObj.getTime() / 1000);

      // Validate: Must be at least 10 minutes in the future (Facebook rule)
      const tenMinsFromNow = Math.floor(Date.now() / 1000) + 600;
      if (publishTimestamp < tenMinsFromNow) {
        return NextResponse.json(
          { error: 'Scheduled time must be at least 10 minutes in the future' },
          { status: 400 }
        );
      }
    }

    // 2. Save Draft to Database
    const post = await prisma.post.create({
      data: {
        content,
        scheduledAt: scheduledDateObj,
        status: 'DRAFT',
      },
    });

    // 3. Call FastAPI Backend to handle Facebook Graph API
    const fastApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    try {
      const fbResponse = await fetch(`${fastApiUrl}/api/v1/facebook/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content,
          publish_timestamp: publishTimestamp,
        }),
      });

      const fbData = await fbResponse.json();

      if (!fbResponse.ok) {
        // Update DB status to FAILED
        await prisma.post.update({
          where: { id: post.id },
          data: { status: 'FAILED' },
        });
        throw new Error(fbData.detail || 'Facebook API Error via FastAPI');
      }

      // 4. Update Database with success status
      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: fbData.status, // POSTED or SCHEDULED
          facebookPostId: fbData.post_id,
        },
      });

      return NextResponse.json({ success: true, data: fbData });

    } catch (fbError: any) {
      return NextResponse.json({ error: fbError.message }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Scheduler API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
