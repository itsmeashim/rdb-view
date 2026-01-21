import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { connectionString } = await request.json();

    if (!connectionString) {
      return NextResponse.json({ error: 'Connection string required' }, { status: 400 });
    }

    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString });

    await pool.query('SELECT 1');
    await pool.end();

    return NextResponse.json({ success: true, message: 'Connection successful' });
  } catch (error) {
    console.error('Connection test error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Connection failed' },
      { status: 500 }
    );
  }
}
