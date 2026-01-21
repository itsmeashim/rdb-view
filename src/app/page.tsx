'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
  Button,
} from '@mui/material';
import {
  Settings,
  Search,
  TableChart,
  ViewModule,
  DarkMode,
  LightMode,
  Refresh,
  FilterList,
} from '@mui/icons-material';
import { useDatabase } from '@/context/DatabaseContext';
import { useThemeMode } from '@/theme/ThemeProvider';
import { HTTPXData, ViewMode, GroupBy } from '@/types/httpx';
import HTTPXTable from '@/components/HTTPXTable';
import HTTPXCards from '@/components/HTTPXCards';

interface GroupInfo {
  name: string;
  count: number;
}

export default function HomePage() {
  const router = useRouter();
  const { config, isConfigured } = useDatabase();
  const { mode, toggleTheme } = useThemeMode();

  const [data, setData] = useState<HTTPXData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [programs, setPrograms] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const fetchFilters = useCallback(async () => {
    if (!config?.connectionString) return;

    try {
      const res = await fetch('/api/httpx/filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: config.connectionString }),
      });

      if (res.ok) {
        const data = await res.json();
        setPrograms(data.programs || []);
        setPlatforms(data.platforms || []);
      }
    } catch {
      console.error('Failed to fetch filters');
    }
  }, [config?.connectionString]);

  const fetchData = useCallback(async () => {
    if (!config?.connectionString) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/httpx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionString: config.connectionString,
          search: debouncedSearch || undefined,
          program: selectedProgram || undefined,
          platform: selectedPlatform || undefined,
          page,
          pageSize,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      setData(result.data || []);
      setTotal(result.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [config?.connectionString, debouncedSearch, selectedProgram, selectedPlatform, page, pageSize]);

  const fetchGroups = useCallback(async () => {
    if (!config?.connectionString || groupBy === 'none') {
      setGroups([]);
      return;
    }

    try {
      const res = await fetch('/api/httpx/grouped', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionString: config.connectionString,
          search: debouncedSearch || undefined,
          groupBy,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setGroups(result.groups || []);
      }
    } catch {
      console.error('Failed to fetch groups');
    }
  }, [config?.connectionString, debouncedSearch, groupBy]);

  useEffect(() => {
    if (isConfigured) {
      fetchFilters();
    }
  }, [isConfigured, fetchFilters]);

  useEffect(() => {
    if (isConfigured && viewMode === 'table') {
      fetchData();
    }
  }, [isConfigured, viewMode, fetchData]);

  useEffect(() => {
    if (isConfigured && viewMode === 'card' && groupBy === 'none') {
      fetchData();
    }
  }, [isConfigured, viewMode, groupBy, fetchData]);

  useEffect(() => {
    if (isConfigured && viewMode === 'card' && groupBy !== 'none') {
      fetchGroups();
    }
  }, [isConfigured, viewMode, groupBy, fetchGroups]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(0);
  };

  const handleProgramChange = (value: string) => {
    setSelectedProgram(value);
    setPage(0);
  };

  const handlePlatformChange = (value: string) => {
    setSelectedPlatform(value);
    setPage(0);
  };

  const handleRefresh = () => {
    setPage(0);
    if (viewMode === 'card' && groupBy !== 'none') {
      fetchGroups();
    } else {
      fetchData();
    }
  };

  if (!isConfigured) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Typography variant="h4" fontWeight={700} gutterBottom>
          RDB View
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Configure your database connection to get started
        </Typography>
        <Button variant="contained" size="large" onClick={() => router.push('/settings')}>
          Configure Database
        </Button>
      </Box>
    );
  }

  const showGroupedView = viewMode === 'card' && groupBy !== 'none';
  const displayTotal = showGroupedView
    ? groups.reduce((sum, g) => sum + g.count, 0)
    : total;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 2, flexWrap: 'wrap', py: 1 }}>
          <Typography variant="h6" fontWeight={700} sx={{ minWidth: 100 }}>
            RDB View
          </Typography>

          <TextField
            size="small"
            placeholder="Search URL, input, tech..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 200, maxWidth: 350 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel>Program</InputLabel>
            <Select
              value={selectedProgram}
              label="Program"
              onChange={(e) => handleProgramChange(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {programs.map((p) => (
                <MenuItem key={p} value={p}>{p}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel>Platform</InputLabel>
            <Select
              value={selectedPlatform}
              label="Platform"
              onChange={(e) => handlePlatformChange(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {platforms.map((p) => (
                <MenuItem key={p} value={p}>{p}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, v) => v && setViewMode(v)}
            size="small"
          >
            <ToggleButton value="table">
              <Tooltip title="Table View"><TableChart /></Tooltip>
            </ToggleButton>
            <ToggleButton value="card">
              <Tooltip title="Card View"><ViewModule /></Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>

          {viewMode === 'card' && (
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel>
                <FilterList sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                Group
              </InputLabel>
              <Select
                value={groupBy}
                label="Group"
                onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              >
                <MenuItem value="none">None</MenuItem>
                <MenuItem value="program">Program</MenuItem>
                <MenuItem value="platform">Platform</MenuItem>
              </Select>
            </FormControl>
          )}

          <Box sx={{ flex: 1 }} />

          <Chip label={`${displayTotal.toLocaleString()} total`} size="small" />

          <IconButton onClick={handleRefresh} disabled={loading}>
            <Refresh />
          </IconButton>

          <IconButton onClick={toggleTheme}>
            {mode === 'dark' ? <LightMode /> : <DarkMode />}
          </IconButton>

          <IconButton onClick={() => router.push('/settings')}>
            <Settings />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2, height: 'calc(100vh - 64px)', overflow: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : viewMode === 'table' ? (
          <HTTPXTable
            data={data}
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        ) : (
          <HTTPXCards
            data={data}
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            groupBy={groupBy}
            groups={groups}
            connectionString={config?.connectionString || ''}
            search={debouncedSearch}
          />
        )}
      </Box>
    </Box>
  );
}
