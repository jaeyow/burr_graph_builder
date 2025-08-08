import React from 'react';
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
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeStyle = {
    strokeWidth: 2,
    stroke: data?.condition === 'default' ? '#94a3b8' : '#3b82f6',
    ...(style as React.CSSProperties),
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd || MarkerType.ArrowClosed}
        style={edgeStyle}
      />
      <EdgeLabelRenderer>
        {data?.condition && data.condition !== 'default' && (
          <Box
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: 'all',
            }}
          >
            <Chip
              label={data.condition}
              size="small"
              variant="outlined"
              sx={{
                backgroundColor: 'white',
                fontSize: '10px',
                height: '20px',
                '& .MuiChip-label': {
                  px: 1,
                },
              }}
            />
          </Box>
        )}
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomEdge;
