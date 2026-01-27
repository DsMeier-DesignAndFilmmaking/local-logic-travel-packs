// src/app/api/pack/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { normalizeCityName } from '@/lib/cities';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');

  if (!city) return NextResponse.json({ error: 'City required' }, { status: 400 });

  const normalized = normalizeCityName(city);
  const filePath = path.join(process.cwd(), 'data', 'travelPacks', `${normalized}.json`);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Pack not found' }, { status: 404 });
  }

  const fileData = fs.readFileSync(filePath, 'utf8');
  return NextResponse.json(JSON.parse(fileData));
}