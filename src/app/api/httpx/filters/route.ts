import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { connectionString } = await request.json();

    if (!connectionString) {
      return NextResponse.json({ error: 'Connection string required' }, { status: 400 });
    }

    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString });

    const [programsResult, platformsResult] = await Promise.all([
      pool.query('SELECT DISTINCT program FROM httpx_data WHERE program IS NOT NULL ORDER BY program'),
      pool.query('SELECT DISTINCT platform FROM httpx_data WHERE platform IS NOT NULL ORDER BY platform'),
    ]);

    await pool.end();

    return NextResponse.json({
      programs: programsResult.rows.map((r) => r.program),
      platforms: platformsResult.rows.map((r) => r.platform),
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Database error' },
      { status: 500 }
    );
  }
}
