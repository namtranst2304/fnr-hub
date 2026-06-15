import { NextResponse } from 'next/server';
import { ScheduleFbPostDto } from '@/lib/dto';
import { API_ROUTES } from '@/lib/constants';

export async function POST(req: Request) {
  try {
    // 1. Receive and validate data using DTO
    const body = await req.json();
    const validation = ScheduleFbPostDto.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    // 2. Proxy request to Python Backend (which handles DB and FB Graph API)
    const backendRes = await fetch(`${API_ROUTES.BASE_URL}/api/v1/facebook/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validation.data),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json({ error: data.detail || 'Failed to schedule post' }, { status: backendRes.status });
    }

    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error("Schedule Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
