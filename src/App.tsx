import React, { useEffect } from 'react';
import { Box, Typography, AppBar, Toolbar } from '@mui/material';
import GraphBuilder from './components/GraphBuilder';

function App() {
  // Fallback error suppression for any remaining ResizeObserver issues
  useEffect(() => {
    const handleError = (e: ErrorEvent) => {
      if (e.message && e.message.includes('ResizeObserver loop completed with undelivered notifications')) {
        console.warn('ResizeObserver loop detected - this should be rare with debouncing in place');
        e.stopImmediatePropagation();
        e.preventDefault();
        return false;
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Burr Graph Builder
          </Typography>
        </Toolbar>
      </AppBar>
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <GraphBuilder />
      </Box>
    </Box>
  );
}

export default App;
