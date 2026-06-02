import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    // 1. Nhận dữ liệu từ giao diện gửi lên
    const body = await req.json();
    const { postId, scheduledTime } = body; 
    // scheduledTime phải là chuỗi ISO string (VD: "2026-06-03T15:00:00.000Z")

    // 2. Lấy bài viết đã được AI xào nấu từ Database
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post || !post.rewrittenText) {
      return NextResponse.json({ error: "Bài viết không tồn tại hoặc chưa được AI xử lý" }, { status: 400 });
    }

    // 3. Đổi thời gian sang định dạng Timestamp (Giây) của Facebook
    // JavaScript mặc định lấy mili-giây, nên phải chia 1000
    const publishTimestamp = Math.floor(new Date(scheduledTime).getTime() / 1000);

    // 4. Gọi Graph API của Facebook
    const PAGE_ID = process.env.FACEBOOK_PAGE_ID;
    const ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
    
    const fbResponse = await fetch(`https://graph.facebook.com/v19.0/${PAGE_ID}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: post.rewrittenText,
        published: 'false', // Quan trọng: Đặt false để FB giữ lại chờ đến giờ
        scheduled_publish_time: publishTimestamp,
        access_token: ACCESS_TOKEN
      }),
    });

    const fbData = await fbResponse.json();

    if (fbData.error) {
      console.error("Facebook API Error:", fbData.error);
      return NextResponse.json({ error: fbData.error.message }, { status: 400 });
    }

    // 5. Cập nhật lại Database: Đổi trạng thái và lưu ID Facebook
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: 'SCHEDULED',
        scheduledAt: new Date(scheduledTime),
        fbPostId: fbData.id // Lưu lại ID này để quản lý
      }
    });

    return NextResponse.json({ success: true, fbPostId: fbData.id });

  } catch (error) {
    console.error("Lỗi Server:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
