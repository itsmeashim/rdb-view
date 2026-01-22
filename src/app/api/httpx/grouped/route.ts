import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { connectionString, search, groupBy, group, page = 0, pageSize = 24 } = await request.json();

    if (!connectionString) {
      return NextResponse.json({ error: 'Connection string required' }, { status: 400 });
    }

    if (!groupBy || !['program', 'platform'].includes(groupBy)) {
      return NextResponse.json({ error: 'Invalid groupBy parameter' }, { status: 400 });
    }

    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString, max: 5, idleTimeoutMillis: 10000 });

    const params: (string | number)[] = [];
    let paramIndex = 1;
    let whereClause = 'WHERE 1=1';

    if (search) {
      whereClause += ` AND (url ILIKE $${paramIndex} OR input ILIKE $${paramIndex} OR tech::text ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // If fetching data for a specific group
    if (group !== undefined) {
      whereClause += ` AND ${groupBy} = $${paramIndex}`;
      params.push(group);
      paramIndex++;

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
        group,
      });
    }

    // Get group summaries with counts
    const groupQuery = `
      SELECT ${groupBy} as name, COUNT(*) as count
      FROM httpx_data ${whereClause}
      GROUP BY ${groupBy}
      ORDER BY count DESC
    `;

    const groupResult = await pool.query(groupQuery, params);
    await pool.end();

    return NextResponse.json({
      groups: groupResult.rows.map((r) => ({
        name: r.name || 'Unknown',
        count: parseInt(r.count, 10),
      })),
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Database error' },
      { status: 500 }
    );
  }
}
