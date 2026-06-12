import { NextResponse } from 'next/server';
import { UpdateAutoConfigDto } from '@/lib/dto';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/api/auto-config`, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Cannot connect to Python Backend' },
      { status: 502 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const validation = UpdateAutoConfigDto.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const res = await fetch(`${API_BASE}/api/auto-config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validation.data),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Cannot connect to Python Backend' },
      { status: 502 }
    );
  }
}

