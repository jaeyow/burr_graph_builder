import React, { useState, useCallback } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  NodeTypes,
  EdgeTypes,
} from '@xyflow/react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  AccountTree as TreeIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  Help as HelpIcon,
} from '@mui/icons-material';

import '@xyflow/react/dist/style.css';
import CustomNode from './CustomNode';
import CustomEdge from './CustomEdge';

const drawerWidth = 280;

// Node types configuration
const nodeTypes: NodeTypes = {
  custom: CustomNode as any,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge as any,
};

// Initial nodes based on the Burr graph structure
const initialNodes: Node[] = [
  {
    id: 'prompt',
    type: 'custom',
    position: { x: 250, y: 50 },
    data: { 
      label: 'Prompt',
      description: 'Initial user input',
      nodeType: 'start',
      icon: 'chat'
    },
  },
  {
    id: 'check_safety',
    type: 'custom',
    position: { x: 250, y: 150 },
    data: { 
      label: 'Check Safety',
      description: 'Validate input safety',
      nodeType: 'process',
      icon: 'security'
    },
  },
  {
    id: 'unsafe_response',
    type: 'custom',
    position: { x: 50, y: 250 },
    data: { 
      label: 'Unsafe Response',
      description: 'Handle unsafe input',
      nodeType: 'end',
      icon: 'warning'
    },
  },
  {
    id: 'decide_mode',
    type: 'custom',
    position: { x: 450, y: 250 },
    data: { 
      label: 'Decide Mode',
      description: 'Determine operation mode',
      nodeType: 'decision',
      icon: 'settings'
    },
  },
  {
    id: 'update_project_name',
    type: 'custom',
    position: { x: 200, y: 350 },
    data: { 
      label: 'Update Project Name',
      description: 'Update project information',
      nodeType: 'process',
      icon: 'edit'
    },
  },
  {
    id: 'run_eligibility_check',
    type: 'custom',
    position: { x: 400, y: 350 },
    data: { 
      label: 'Run Eligibility Check',
      description: 'Check project eligibility',
      nodeType: 'process',
      icon: 'check'
    },
  },
  {
    id: 'upload_ifc_file',
    type: 'custom',
    position: { x: 600, y: 350 },
    data: { 
      label: 'Upload IFC File',
      description: 'Upload building information file',
      nodeType: 'process',
      icon: 'upload'
    },
  },
  {
    id: 'upload_structural_notes',
    type: 'custom',
    position: { x: 800, y: 350 },
    data: { 
      label: 'Upload Structural Notes',
      description: 'Upload structural documentation',
      nodeType: 'process',
      icon: 'description'
    },
  },
  {
    id: 'unknown_intent',
    type: 'custom',
    position: { x: 700, y: 250 },
    data: { 
      label: 'Unknown Intent',
      description: 'Handle unrecognized input',
      nodeType: 'end',
      icon: 'help'
    },
  },
];

// Initial edges based on the Burr graph transitions
const initialEdges: Edge[] = [
  {
    id: 'e1',
    source: 'prompt',
    target: 'check_safety',
    type: 'custom',
    data: { condition: 'default' },
  },
  {
    id: 'e2',
    source: 'check_safety',
    target: 'decide_mode',
    type: 'custom',
    data: { condition: 'safe=True' },
  },
  {
    id: 'e3',
    source: 'check_safety',
    target: 'unsafe_response',
    type: 'custom',
    data: { condition: 'default' },
  },
  {
    id: 'e4',
    source: 'decide_mode',
    target: 'update_project_name',
    type: 'custom',
    data: { condition: 'mode="update_project_name"' },
  },
  {
    id: 'e5',
    source: 'decide_mode',
    target: 'run_eligibility_check',
    type: 'custom',
    data: { condition: 'mode="run_eligibility_check"' },
  },
  {
    id: 'e6',
    source: 'decide_mode',
    target: 'upload_ifc_file',
    type: 'custom',
    data: { condition: 'mode="upload_ifc_file"' },
  },
  {
    id: 'e7',
    source: 'decide_mode',
    target: 'upload_structural_notes',
    type: 'custom',
    data: { condition: 'mode="upload_structural_notes"' },
  },
  {
    id: 'e8',
    source: 'decide_mode',
    target: 'unknown_intent',
    type: 'custom',
    data: { condition: 'default' },
  },
  // Return edges to prompt
  {
    id: 'e9',
    source: 'update_project_name',
    target: 'prompt',
    type: 'custom',
    data: { condition: 'return' },
  },
  {
    id: 'e10',
    source: 'run_eligibility_check',
    target: 'prompt',
    type: 'custom',
    data: { condition: 'return' },
  },
  {
    id: 'e11',
    source: 'upload_ifc_file',
    target: 'prompt',
    type: 'custom',
    data: { condition: 'return' },
  },
  {
    id: 'e12',
    source: 'upload_structural_notes',
    target: 'prompt',
    type: 'custom',
    data: { condition: 'return' },
  },
  {
    id: 'e13',
    source: 'unknown_intent',
    target: 'prompt',
    type: 'custom',
    data: { condition: 'return' },
  },
  {
    id: 'e14',
    source: 'unsafe_response',
    target: 'prompt',
    type: 'custom',
    data: { condition: 'return' },
  },
];

// Available node templates
const nodeTemplates = [
  { type: 'start', label: 'Start Node', icon: <TreeIcon />, color: '#4caf50' },
  { type: 'process', label: 'Process Node', icon: <SettingsIcon />, color: '#2196f3' },
  { type: 'decision', label: 'Decision Node', icon: <HelpIcon />, color: '#ff9800' },
  { type: 'end', label: 'End Node', icon: <WarningIcon />, color: '#f44336' },
];

interface NodeDialogData {
  label: string;
  description: string;
  nodeType: string;
  icon: string;
}

const GraphBuilder: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeDialog, setNodeDialog] = useState(false);
  const [nodeDialogData, setNodeDialogData] = useState<NodeDialogData>({
    label: '',
    description: '',
    nodeType: 'process',
    icon: 'settings',
  });

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'custom',
        data: { condition: 'default' },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const handleAddNode = useCallback(() => {
    setNodeDialog(true);
  }, []);

  const handleCreateNode = useCallback(() => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: 'custom',
      position: { x: Math.random() * 500 + 100, y: Math.random() * 500 + 100 },
      data: {
        label: nodeDialogData.label,
        description: nodeDialogData.description,
        nodeType: nodeDialogData.nodeType,
        icon: nodeDialogData.icon,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setNodeDialog(false);
    setNodeDialogData({
      label: '',
      description: '',
      nodeType: 'process',
      icon: 'settings',
    });
  }, [nodeDialogData, setNodes]);

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      {/* Side drawer with node templates */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            position: 'relative',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Node Templates
          </Typography>
          <List>
            {nodeTemplates.map((template) => (
              <ListItem key={template.type} disablePadding>
                <ListItemButton
                  onClick={() => {
                    setNodeDialogData({
                      ...nodeDialogData,
                      nodeType: template.type,
                      icon: template.type,
                    });
                    setNodeDialog(true);
                  }}
                >
                  <ListItemIcon sx={{ color: template.color }}>
                    {template.icon}
                  </ListItemIcon>
                  <ListItemText primary={template.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main ReactFlow area */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        </ReactFlow>

        {/* Add Node FAB */}
        <Fab
          color="primary"
          aria-label="add node"
          sx={{ position: 'absolute', bottom: 16, right: 16 }}
          onClick={handleAddNode}
        >
          <AddIcon />
        </Fab>
      </Box>

      {/* Add Node Dialog */}
      <Dialog open={nodeDialog} onClose={() => setNodeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Node</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Node Label"
              value={nodeDialogData.label}
              onChange={(e) =>
                setNodeDialogData({ ...nodeDialogData, label: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Description"
              value={nodeDialogData.description}
              onChange={(e) =>
                setNodeDialogData({ ...nodeDialogData, description: e.target.value })
              }
              multiline
              rows={3}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Node Type</InputLabel>
              <Select
                value={nodeDialogData.nodeType}
                onChange={(e) =>
                  setNodeDialogData({ ...nodeDialogData, nodeType: e.target.value })
                }
              >
                {nodeTemplates.map((template) => (
                  <MenuItem key={template.type} value={template.type}>
                    {template.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNodeDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateNode} variant="contained">
            Create Node
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GraphBuilder;
