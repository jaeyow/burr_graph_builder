import React, { memo, useState, useCallback, useRef } from 'react';
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
  onLabelChange?: (nodeId: string, newLabel: string) => void;
}

type CustomNodeType = Node<CustomNodeData>;

const CustomNode: React.FC<NodeProps<CustomNodeType>> = ({ id, data, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [labelValue, setLabelValue] = useState(data.label);
  const [fixedWidth, setFixedWidth] = useState<number | null>(null);
  const [fixedHeight, setFixedHeight] = useState<number | null>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  
  // Use colorIndex if provided, otherwise generate based on node id
  const colorIndex = data.colorIndex ?? (parseInt(id.replace(/\D/g, '')) % pastelColors.length);
  const colors = pastelColors[colorIndex];

  const handleDelete = () => {
    if (data.onDelete && typeof data.onDelete === 'function') {
      data.onDelete(id);
    }
  };

  const handleLabelClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Capture current width and height before switching to edit mode
    if (paperRef.current) {
      setFixedWidth(paperRef.current.offsetWidth);
      setFixedHeight(paperRef.current.offsetHeight);
    }
    setIsEditing(true);
  }, []);

  const handleLabelChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setLabelValue(event.target.value);
  }, []);

  const handleLabelBlur = useCallback(() => {
    setIsEditing(false);
    setFixedWidth(null); // Release the fixed width
    setFixedHeight(null); // Release the fixed height
    if (data.onLabelChange && labelValue.trim() !== data.label) {
      data.onLabelChange(id, labelValue.trim() || data.label);
    }
  }, [data, id, labelValue]);

  const handleLabelKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Stop propagation to prevent global keyboard handlers from interfering
    event.stopPropagation();
    
    if (event.key === 'Enter') {
      handleLabelBlur();
    } else if (event.key === 'Escape') {
      setLabelValue(data.label);
      setIsEditing(false);
      setFixedWidth(null); // Release the fixed width
      setFixedHeight(null); // Release the fixed height
    }
  }, [data.label, handleLabelBlur]);

  // Determine styling based on node type
  const isInputNode = data.nodeType === 'input';

  return (
    <Paper
      ref={paperRef}
      elevation={selected ? 4 : 1}
      sx={{
        minWidth: 120,
        maxWidth: 180,
        width: fixedWidth ? `${fixedWidth}px` : 'fit-content',
        height: fixedHeight ? `${fixedHeight}px` : 'auto',
        border: `2px ${isInputNode ? 'dashed' : 'solid'} ${isInputNode ? '#666' : colors.border}`,
        borderRadius: 2, // Same rectangle shape for all nodes
        backgroundColor: isInputNode ? '#fff' : colors.background,
        transition: 'all 0.2s ease-in-out',
        transform: selected ? 'scale(1.05)' : 'scale(1)',
        position: 'relative',
        overflow: 'visible', // Allow handles to extend beyond bounds
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
          background: 'white',
          border: `2px solid ${isInputNode ? '#666' : colors.border}`,
          width: 12,
          height: 12,
          // Centered on the top edge, extending beyond bounds
        }}
      />

      {/* Node Content */}
      <Box sx={{ 
        p: 1.5, 
        position: 'relative',
        // For input nodes, center content in the ellipse
        ...(isInputNode && {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center',
        })
      }}>
        {/* Delete button - only show when selected */}
        {selected && (
          <IconButton
            size="small"
            onClick={handleDelete}
            sx={{ 
              position: 'absolute',
              top: 4,
              right: 4,
              color: isInputNode ? '#666' : colors.border,
              p: 0.25,
              '&:hover': {
                backgroundColor: `${isInputNode ? '#666' : colors.border}20`,
              }
            }}
          >
            <DeleteIcon sx={{ fontSize: 14 }} />
          </IconButton>
        )}

        {isEditing ? (
          <input
            value={labelValue}
            onChange={handleLabelChange}
            onBlur={handleLabelBlur}
            onKeyDown={handleLabelKeyDown}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              color: isInputNode ? '#666' : colors.border,
              fontFamily: 'inherit',
              width: '100%',
              boxSizing: 'border-box',
              padding: 0,
              margin: 0,
              lineHeight: 1.43,
              marginBottom: data.description ? '8px' : 0, // Match Typography margin exactly (0.5 * 16px = 8px)
              paddingRight: selected ? '24px' : 0,
              verticalAlign: 'baseline',
              display: 'block',
              textAlign: isInputNode ? 'center' : 'left',
            }}
          />
        ) : (
          <Typography
            variant="body2"
            onClick={handleLabelClick}
            sx={{
              fontWeight: 'bold',
              mb: data.description ? 0.5 : 0,
              wordWrap: 'break-word',
              color: isInputNode ? '#666' : colors.border,
              pr: selected ? 3 : 0, // Add padding when delete button is visible
              cursor: 'pointer',
              textAlign: isInputNode ? 'center' : 'left',
              '&:hover': {
                opacity: 0.8,
              },
            }}
          >
            {data.label}
          </Typography>
        )}
        
        {data.description && (
          <Typography
            variant="caption"
            sx={{
              color: isInputNode ? '#666' : colors.border,
              opacity: 0.8,
              display: 'block',
              wordWrap: 'break-word',
              textAlign: isInputNode ? 'center' : 'left',
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
          background: 'white',
          border: `2px solid ${isInputNode ? '#666' : colors.border}`,
          width: 12,
          height: 12,
          // Centered on the bottom edge, extending beyond bounds
        }}
      />
    </Paper>
  );
};

export default memo(CustomNode);
