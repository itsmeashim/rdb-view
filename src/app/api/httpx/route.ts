import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { connectionString, search, program, platform, page = 0, pageSize = 50 } = await request.json();

    if (!connectionString) {
      return NextResponse.json({ error: 'Connection string required' }, { status: 400 });
    }

    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString, max: 5, idleTimeoutMillis: 10000 });

    const params: (string | number)[] = [];
    let paramIndex = 1;
    let whereClause = 'WHERE 1=1';

    if (search) {
      whereClause += ` AND (url ILIKE $${paramIndex} OR input ILIKE $${paramIndex} OR $${paramIndex + 1} ILIKE ANY(COALESCE(tech, ARRAY[]::text[])))`;
      params.push(`%${search}%`, `%${search}%`);
      paramIndex += 2;
    }

    if (program) {
      whereClause += ` AND program = $${paramIndex}`;
      params.push(program);
      paramIndex++;
    }

    if (platform) {
      whereClause += ` AND platform = $${paramIndex}`;
      params.push(platform);
      paramIndex++;
    }

    const countQuery = `SELECT COUNT(*) FROM httpx_data ${whereClause}`;
    const dataQuery = `SELECT * FROM httpx_data ${whereClause} ORDER BY id DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    const offset = page * pageSize;
    const dataParams = [...params, pageSize, offset];

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, params),
      pool.query(dataQuery, dataParams),
    ]);

    await pool.end();

    return NextResponse.json({
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Database error' },
      { status: 500 }
    );
  }
}
