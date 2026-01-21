'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { ArrowBack, Storage, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { useDatabase } from '@/context/DatabaseContext';

export default function SettingsPage() {
  const router = useRouter();
  const { config, setConfig, clearConfig, isConfigured } = useDatabase();
  const [connectionString, setConnectionString] = useState(config?.connectionString || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTest = async () => {
    if (!connectionString.trim()) return;

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString }),
      });

      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.success ? 'Connection successful!' : data.error,
      });
    } catch {
      setTestResult({ success: false, message: 'Failed to test connection' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (!connectionString.trim()) return;
    setConfig({ connectionString });
    router.push('/');
  };

  const handleClear = () => {
    clearConfig();
    setConnectionString('');
    setTestResult(null);
  };

  return (
    <Box sx={{ minHeight: '100vh', p: 3 }}>
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <IconButton onClick={() => router.push('/')} sx={{ bgcolor: 'action.hover' }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight={700}>
            Database Settings
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Storage color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  PostgreSQL Connection
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Enter your database connection string
                </Typography>
              </Box>
            </Box>

            <TextField
              fullWidth
              label="Connection String"
              placeholder="postgresql://user:password@host:port/database"
              value={connectionString}
              onChange={(e) => setConnectionString(e.target.value)}
              multiline
              rows={2}
              sx={{ mb: 3 }}
            />

            {testResult && (
              <Alert
                severity={testResult.success ? 'success' : 'error'}
                icon={testResult.success ? <CheckCircle /> : <ErrorIcon />}
                sx={{ mb: 3 }}
              >
                {testResult.message}
              </Alert>
            )}

            {isConfigured && (
              <Alert severity="info" sx={{ mb: 3 }}>
                Connection is configured and stored in browser.
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                onClick={handleTest}
                disabled={testing || !connectionString.trim()}
                startIcon={testing ? <CircularProgress size={20} /> : null}
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </Button>

              <Button
                variant="contained"
                onClick={handleSave}
                disabled={!connectionString.trim()}
              >
                Save & Continue
              </Button>

              {isConfigured && (
                <Button variant="outlined" color="error" onClick={handleClear}>
                  Clear Config
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
          Connection string is stored in browser localStorage and persists across sessions.
        </Typography>
      </Box>
    </Box>
  );
}
