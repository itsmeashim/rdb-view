'use client';

import { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Pagination,
  CircularProgress,
} from '@mui/material';
import { OpenInNew, ExpandMore, Language, Dns } from '@mui/icons-material';
import { HTTPXData, GroupBy } from '@/types/httpx';

interface GroupInfo {
  name: string;
  count: number;
}

interface Props {
  data: HTTPXData[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  groupBy: GroupBy;
  groups: GroupInfo[];
  connectionString: string;
  search: string;
}

function StatusChip({ code }: { code: number }) {
  const color =
    code >= 200 && code < 300
      ? 'success'
      : code >= 300 && code < 400
        ? 'info'
        : code >= 400 && code < 500
          ? 'warning'
          : 'error';

  return <Chip label={code} size="small" color={color} sx={{ fontWeight: 600 }} />;
}

function HTTPXCard({ item }: { item: HTTPXData }) {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }}
    >
      <CardContent sx={{ flex: 1, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          <StatusChip code={item.status_code} />
          <IconButton
            size="small"
            onClick={() => window.open(item.url, '_blank')}
            sx={{ ml: 1 }}
          >
            <OpenInNew fontSize="small" />
          </IconButton>
        </Box>

        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            wordBreak: 'break-all',
            mb: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.url}
        </Typography>

        {item.title && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 1,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.title}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
          <Chip label={item.program} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
          <Chip label={item.platform} size="small" variant="outlined" color="secondary" sx={{ fontSize: '0.7rem' }} />
        </Box>

        {item.tech?.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {item.tech.slice(0, 4).map((t, i) => (
              <Chip key={i} label={t} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
            ))}
            {item.tech.length > 4 && (
              <Chip label={`+${item.tech.length - 4}`} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
            )}
          </Box>
        )}

        <Box sx={{ mt: 1, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {item.webserver && (
            <Typography variant="caption" color="text.secondary">{item.webserver}</Typography>
          )}
          {item.content_length > 0 && (
            <Typography variant="caption" color="text.secondary">{(item.content_length / 1024).toFixed(1)}KB</Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

function GroupAccordion({ group, groupBy, connectionString, search }: {
  group: GroupInfo;
  groupBy: 'program' | 'platform';
  connectionString: string;
  search: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState<HTTPXData[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(group.count);
  const pageSize = 24;

  const fetchGroupData = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/httpx/grouped', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionString,
          search: search || undefined,
          groupBy,
          group: group.name,
          page: pageNum,
          pageSize,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setData(result.data || []);
        setTotal(result.total || group.count);
      }
    } catch (error) {
      console.error('Failed to fetch group data:', error);
    } finally {
      setLoading(false);
    }
  }, [connectionString, search, groupBy, group.name, group.count]);

  const handleExpand = (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded);
    if (isExpanded && data.length === 0) {
      fetchGroupData(0);
    }
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage - 1);
    fetchGroupData(newPage - 1);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <Accordion expanded={expanded} onChange={handleExpand}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {groupBy === 'program' ? <Language /> : <Dns />}
          <Typography variant="h6" fontWeight={600}>{group.name}</Typography>
          <Chip label={group.count.toLocaleString()} size="small" color="primary" />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {loading && data.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 2,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {data.map((item, idx) => (
                <HTTPXCard key={item.id || idx} item={item} />
              ))}
            </Box>
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={page + 1}
                  onChange={handlePageChange}
                  color="primary"
                  disabled={loading}
                />
              </Box>
            )}
          </>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

export default function HTTPXCards({ data, total, page, pageSize, onPageChange, groupBy, groups, connectionString, search }: Props) {
  const totalPages = Math.ceil(total / pageSize);

  if (groupBy !== 'none' && groups.length > 0) {
    return (
      <Box sx={{ minHeight: 'calc(100vh - 96px)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {groups.map((group) => (
          <GroupAccordion
            key={group.name}
            group={group}
            groupBy={groupBy as 'program' | 'platform'}
            connectionString={connectionString}
            search={search}
          />
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: 'calc(100vh - 96px)', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 2,
          alignContent: 'start',
        }}
      >
        {data.map((item, idx) => (
          <HTTPXCard key={item.id || idx} item={item} />
        ))}
      </Box>
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <Pagination
            count={totalPages}
            page={page + 1}
            onChange={(_, newPage) => onPageChange(newPage - 1)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
}
