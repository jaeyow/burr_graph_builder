import React, { useState, useCallback } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
  MarkerType,
  Edge,
} from '@xyflow/react';
import { Chip, Box } from '@mui/material';

export interface CustomEdgeData extends Record<string, unknown> {
  condition?: string;
  isConditional?: boolean;
  label?: string;
  conditionalGroup?: string; // Identifies which conditional group this edge belongs to
  onLabelChange?: (edgeId: string, newLabel: string) => void;
  onGroupLabelChange?: (sourceNodeId: string, newLabel: string) => void;
}

type CustomEdgeType = Edge<CustomEdgeData>;

const CustomEdge: React.FC<EdgeProps<CustomEdgeType>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
  selected,
  source, // Add source prop to get source node ID
}) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const isConditional = data?.isConditional || (data?.condition && data.condition !== 'default');
  
  // For conditional edges, show the group label; for non-conditional edges, no label
  const displayLabel = isConditional ? (data?.label || 'condition') : '';
  const [labelValue, setLabelValue] = useState(displayLabel);

  // Update labelValue when data changes (important for group label synchronization)
  React.useEffect(() => {
    const newDisplayLabel = isConditional ? (data?.label || 'condition') : '';
    setLabelValue(newDisplayLabel);
  }, [data?.label, data?.condition, isConditional]);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeStyle: React.CSSProperties = {
    strokeWidth: selected ? 4 : 2,
    stroke: (style as React.CSSProperties)?.stroke || (data?.condition === 'default' ? '#94a3b8' : '#429dbce6'),
    ...(style as React.CSSProperties),
  };

  // Add dashed animation for conditional edges
  if (isConditional) {
    edgeStyle.strokeDasharray = '8,4';
    edgeStyle.animation = 'dash 2s linear infinite';
  }

  const handleLabelClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  const handleLabelChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setLabelValue(event.target.value);
  }, []);

  const handleLabelBlur = useCallback(() => {
    setIsEditing(false);
    const newLabel = labelValue.trim() || 'condition';
    
    // For conditional edges, update all edges from the same source node
    if (isConditional && data?.onGroupLabelChange && source) {
      if (newLabel !== (data?.label || data?.condition)) {
        data.onGroupLabelChange(source, newLabel);
      }
    } else if (data?.onLabelChange && newLabel !== (data?.label || data?.condition)) {
      data.onLabelChange(id, newLabel);
    }
  }, [data, id, labelValue, isConditional, source]);

  const handleLabelKeyDown = useCallback((event: React.KeyboardEvent) => {
    event.stopPropagation();
    
    if (event.key === 'Enter') {
      handleLabelBlur();
    } else if (event.key === 'Escape') {
      setLabelValue(data?.label || data?.condition || '');
      setIsEditing(false);
    }
  }, [data?.label, data?.condition, handleLabelBlur]);

  return (
    <>
      {/* Add CSS animation for dashed lines */}
      <style>
        {`
          @keyframes dash {
            to {
              stroke-dashoffset: -12;
            }
          }
        `}
      </style>
      
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd || MarkerType.ArrowClosed}
        style={edgeStyle}
      />
      <EdgeLabelRenderer>
        {isConditional && (
          <Box
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: 'all',
            }}
          >
            {isEditing ? (
              <input
                value={labelValue}
                onChange={handleLabelChange}
                onBlur={handleLabelBlur}
                onKeyDown={handleLabelKeyDown}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '12px',
                  padding: '4px 8px',
                  fontSize: '10px',
                  background: 'white',
                  minWidth: '60px',
                  textAlign: 'center',
                }}
              />
            ) : (
              <Chip
                label={isConditional ? (data?.label || 'condition') : (data?.label || data?.condition || 'condition')}
                size="small"
                variant="outlined"
                onClick={handleLabelClick}
                sx={{
                  backgroundColor: 'white',
                  fontSize: '10px',
                  height: '20px',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                  '& .MuiChip-label': {
                    px: 1,
                  },
                }}
              />
            )}
          </Box>
        )}
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomEdge;
