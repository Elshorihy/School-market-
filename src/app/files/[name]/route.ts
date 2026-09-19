import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export const runtime = 'nodejs';

const TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif'
};

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  // Only allow a flat filename with a known image extension (no traversal).
  if (!/^[\w-]+\.(jpg|jpeg|png|webp|gif)$/i.test(name)) {
    return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });
  }
  const filePath = path.join(process.cwd(), 'uploads', name);
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) throw new Error('missing');
    const buf = await fs.readFile(filePath);
    return new NextResponse(buf, {
      headers: {
        'Content-Type': TYPES[path.extname(name).toLowerCase()] ?? 'application/octet-stream',
        'Content-Length': String(stat.size),
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });
  }
}
