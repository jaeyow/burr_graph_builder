import React from 'react';
import { Box, Typography, AppBar, Toolbar } from '@mui/material';
import GraphBuilder from './components/GraphBuilder';

function App() {
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
