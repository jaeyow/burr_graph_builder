import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import {
  Paper,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  Settings as SettingsIcon,
  Upload as UploadIcon,
  Description as DescriptionIcon,
  Help as HelpIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

const iconMap = {
  chat: ChatIcon,
  security: SecurityIcon,
  warning: WarningIcon,
  settings: SettingsIcon,
  upload: UploadIcon,
  description: DescriptionIcon,
  help: HelpIcon,
  edit: EditIcon,
  check: CheckIcon,
  start: ChatIcon,
  process: SettingsIcon,
  decision: HelpIcon,
  end: WarningIcon,
} as const;

const nodeTypeColors = {
  start: '#4caf50',
  process: '#2196f3',
  decision: '#ff9800',
  end: '#f44336',
} as const;

export interface CustomNodeData extends Record<string, unknown> {
  label: string;
  description?: string;
  nodeType: keyof typeof nodeTypeColors;
  icon: keyof typeof iconMap;
  onDelete?: (nodeId: string) => void;
  onUpdate?: (nodeId: string, data: any) => void;
}

type CustomNodeType = Node<CustomNodeData>;

const CustomNode: React.FC<NodeProps<CustomNodeType>> = ({ id, data, selected }) => {
  const IconComponent = iconMap[data.icon] || SettingsIcon;
  const nodeColor = nodeTypeColors[data.nodeType] || '#2196f3';

  const handleDelete = () => {
    if (data.onDelete) {
      data.onDelete(id);
    }
  };

  return (
    <Paper
      elevation={selected ? 8 : 2}
      sx={{
        minWidth: 150,
        maxWidth: 200,
        border: selected ? `2px solid ${nodeColor}` : 'none',
        borderRadius: 2,
        backgroundColor: 'white',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          elevation: 4,
          transform: 'translateY(-1px)',
        },
      }}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: nodeColor,
          width: 8,
          height: 8,
        }}
      />

      {/* Node Header */}
      <Box
        sx={{
          backgroundColor: nodeColor,
          color: 'white',
          p: 1,
          borderRadius: '8px 8px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconComponent sx={{ fontSize: 16 }} />
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            {data.nodeType.toUpperCase()}
          </Typography>
        </Box>
        {selected && (
          <IconButton
            size="small"
            onClick={handleDelete}
            sx={{ color: 'white', p: 0.25 }}
          >
            <DeleteIcon sx={{ fontSize: 14 }} />
          </IconButton>
        )}
      </Box>

      {/* Node Content */}
      <Box sx={{ p: 1.5 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 'bold',
            mb: data.description ? 0.5 : 0,
            wordWrap: 'break-word',
          }}
        >
          {data.label}
        </Typography>
        {data.description && (
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
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
          background: nodeColor,
          width: 8,
          height: 8,
        }}
      />
    </Paper>
  );
};

export default memo(CustomNode);
