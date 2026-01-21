'use client';

import { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  TablePagination,
  Tooltip,
  IconButton,
  Collapse,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, OpenInNew } from '@mui/icons-material';
import { HTTPXData } from '@/types/httpx';

interface Props {
  data: HTTPXData[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
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

function Row({ row }: { row: HTTPXData }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow
        hover
        sx={{ '& > *': { borderBottom: 'unset' }, cursor: 'pointer' }}
        onClick={() => setOpen(!open)}
      >
        <TableCell padding="checkbox">
          <IconButton size="small">
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Tooltip title={row.url}>
            <Typography
              variant="body2"
              sx={{
                maxWidth: 300,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {row.url}
            </Typography>
          </Tooltip>
        </TableCell>
        <TableCell>
          <StatusChip code={row.status_code} />
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {row.title || '-'}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip label={row.program} size="small" variant="outlined" />
        </TableCell>
        <TableCell>
          <Chip label={row.platform} size="small" variant="outlined" color="secondary" />
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 200 }}>
            {row.tech?.slice(0, 3).map((t, i) => (
              <Chip key={i} label={t} size="small" sx={{ fontSize: '0.7rem' }} />
            ))}
            {row.tech?.length > 3 && (
              <Chip label={`+${row.tech.length - 3}`} size="small" variant="outlined" />
            )}
          </Box>
        </TableCell>
        <TableCell align="center">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              window.open(row.url, '_blank');
            }}
          >
            <OpenInNew fontSize="small" />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 1 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                <DetailItem label="Input" value={row.input} />
                <DetailItem label="Host" value={row.host} />
                <DetailItem label="Path" value={row.path} />
                <DetailItem label="Scheme" value={row.scheme} />
                <DetailItem label="Method" value={row.method} />
                <DetailItem label="Port" value={row.port} />
                <DetailItem label="Webserver" value={row.webserver} />
                <DetailItem label="Content Type" value={row.content_type} />
                <DetailItem label="Content Length" value={row.content_length?.toString()} />
                <DetailItem label="Words" value={row.words?.toString()} />
                <DetailItem label="Lines" value={row.lines?.toString()} />
                <DetailItem label="Location" value={row.location} />
                <DetailItem label="Time" value={row.time} />
              </Box>
              {row.tech?.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Technologies
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                    {row.tech.map((t, i) => (
                      <Chip key={i} label={t} size="small" />
                    ))}
                  </Box>
                </Box>
              )}
              {row.a?.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    A Records
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                    {row.a.map((ip, i) => (
                      <Chip key={i} label={ip} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

function DetailItem({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function HTTPXTable({ data, total, page, pageSize, onPageChange, onPageSizeChange }: Props) {
  return (
    <Paper sx={{ width: '100%', height: 'calc(100vh - 96px)', display: 'flex', flexDirection: 'column' }}>
      <TableContainer sx={{ flex: 1 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell sx={{ fontWeight: 600 }}>URL</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Program</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Platform</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Tech</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Open</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, idx) => (
              <Row key={row.id || idx} row={row} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[25, 50, 100]}
        component="div"
        count={total}
        rowsPerPage={pageSize}
        page={page}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        onRowsPerPageChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
      />
    </Paper>
  );
}
