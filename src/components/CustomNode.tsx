import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import {
  Paper,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import {
  Delete as DeleteIcon,
} from '@mui/icons-material';

// Pastel color palette for nodes
const pastelColors = [
  { border: '#FF6B6B', background: '#FFE5E5' }, // Coral
  { border: '#4ECDC4', background: '#E5F9F6' }, // Turquoise
  { border: '#45B7D1', background: '#E5F4FD' }, // Sky blue
  { border: '#96CEB4', background: '#F0F9F4' }, // Mint green
  { border: '#FFEAA7', background: '#FFFCF0' }, // Light yellow
  { border: '#DDA0DD', background: '#F5F0F5' }, // Plum
  { border: '#98D8C8', background: '#F0FAF7' }, // Seafoam
  { border: '#F7DC6F', background: '#FEFBF0' }, // Pale yellow
  { border: '#BB8FCE', background: '#F4F1F7' }, // Lavender
  { border: '#85C1E9', background: '#F0F8FF' }, // Light blue
];

export interface CustomNodeData extends Record<string, unknown> {
  label: string;
  description?: string;
  nodeType: string;
  icon: string;
  colorIndex?: number;
  onDelete?: (nodeId: string) => void;
}

type CustomNodeType = Node<CustomNodeData>;

const CustomNode: React.FC<NodeProps<CustomNodeType>> = ({ id, data, selected }) => {
  // Use colorIndex if provided, otherwise generate based on node id
  const colorIndex = data.colorIndex ?? (parseInt(id.replace(/\D/g, '')) % pastelColors.length);
  const colors = pastelColors[colorIndex];

  const handleDelete = () => {
    if (data.onDelete && typeof data.onDelete === 'function') {
      data.onDelete(id);
    }
  };

  return (
    <Paper
      elevation={selected ? 4 : 1}
      sx={{
        minWidth: 120,
        maxWidth: 180,
        border: `2px solid ${colors.border}`,
        borderRadius: 2,
        backgroundColor: colors.background,
        transition: 'all 0.2s ease-in-out',
        transform: selected ? 'scale(1.05)' : 'scale(1)',
        position: 'relative',
        '&:hover': {
          elevation: 3,
          transform: selected ? 'scale(1.05)' : 'scale(1.02)',
        },
      }}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: colors.border,
          width: 8,
          height: 8,
          border: 'none',
        }}
      />

      {/* Node Content */}
      <Box sx={{ p: 1.5, position: 'relative' }}>
        {/* Delete button - only show when selected */}
        {selected && (
          <IconButton
            size="small"
            onClick={handleDelete}
            sx={{ 
              position: 'absolute',
              top: 4,
              right: 4,
              color: colors.border,
              p: 0.25,
              '&:hover': {
                backgroundColor: `${colors.border}20`,
              }
            }}
          >
            <DeleteIcon sx={{ fontSize: 14 }} />
          </IconButton>
        )}

        <Typography
          variant="body2"
          sx={{
            fontWeight: 'bold',
            mb: data.description ? 0.5 : 0,
            wordWrap: 'break-word',
            color: colors.border,
            pr: selected ? 3 : 0, // Add padding when delete button is visible
          }}
        >
          {data.label}
        </Typography>
        
        {data.description && (
          <Typography
            variant="caption"
            sx={{
              color: colors.border,
              opacity: 0.8,
              display: 'block',
              wordWrap: 'break-word',
            }}
          >
            {data.description}
          </Typography>
        )}
      </Box>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: colors.border,
          width: 8,
          height: 8,
          border: 'none',
        }}
      />
    </Paper>
  );
};

export default memo(CustomNode);
