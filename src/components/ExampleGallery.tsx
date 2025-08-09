import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { ExampleGraph } from '../data/examples';

interface ExampleGalleryProps {
  examples: ExampleGraph[];
  onLoadExample: (example: ExampleGraph) => void;
}

const ExampleGallery: React.FC<ExampleGalleryProps> = ({ examples, onLoadExample }) => {
  return (
    <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
      <Typography variant="h6" gutterBottom>
        Example Graphs
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Load pre-built examples to explore the graph builder
      </Typography>

      {examples.map((example) => (
        <Card 
          key={example.id} 
          sx={{ 
            mb: 2, 
            '&:hover': { 
              boxShadow: 2,
              transform: 'translateY(-1px)',
              transition: 'all 0.2s ease-in-out'
            } 
          }}
          variant="outlined"
        >
          <CardContent sx={{ pb: 1 }}>
            <Typography variant="subtitle1" component="h3" gutterBottom>
              {example.title}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {example.description}
            </Typography>

            <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
              <Chip 
                label={`${example.nodes.length} nodes`} 
                size="small" 
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
              <Chip 
                label={`${example.edges.length} edges`} 
                size="small" 
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            </Box>
          </CardContent>

          <CardActions sx={{ pt: 0 }}>
            <Button
              size="small"
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={() => onLoadExample(example)}
              sx={{ 
                textTransform: 'none',
                fontSize: '0.8rem'
              }}
            >
              Load Example
            </Button>
            <Button
              size="small"
              startIcon={<VisibilityIcon />}
              sx={{ 
                textTransform: 'none',
                fontSize: '0.8rem'
              }}
            >
              Preview
            </Button>
          </CardActions>
        </Card>
      ))}

      {examples.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          No examples available yet.
        </Typography>
      )}
    </Box>
  );
};

export default ExampleGallery;
