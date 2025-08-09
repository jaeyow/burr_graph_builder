import React, { useState, useCallback, useEffect } from 'react';
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
  ReactFlowInstance,
} from '@xyflow/react';
import {
  Box,
  Drawer,
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
  Popover,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  AccountTree as TreeIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  Help as HelpIcon,
  Download as DownloadIcon,
  Code as CodeIcon,
} from '@mui/icons-material';

import '@xyflow/react/dist/style.css';
import CustomNode from './CustomNode';
import CustomEdge from './CustomEdge';
import ExampleGallery from './ExampleGallery';
import ConfirmLoadExampleDialog from './ConfirmLoadExampleDialog';
import { GraphExporter } from '../utils/GraphExporter';
import { BurrGraphCodeGenerator } from '../utils/BurrCodeGenerator';
import { ExampleLoader } from '../utils/ExampleLoader';
import { examples } from '../data/examples';
import type { ExampleGraph } from '../data/examples';

const drawerWidth = 280;

// Node types configuration
const nodeTypes: NodeTypes = {
  custom: CustomNode as any,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge as any,
};

// Initial nodes - start with empty canvas
const initialNodes: Node[] = [];

// Initial edges - start with empty canvas
const initialEdges: Edge[] = [];

// Available node templates
const nodeTemplates = [
  { type: 'start', label: 'Start Node', icon: <TreeIcon />, color: '#4caf50' },
  { type: 'process', label: 'Process Node', icon: <SettingsIcon />, color: '#429dbce6' },
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
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [nodeDialog, setNodeDialog] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [colorPickerAnchor, setColorPickerAnchor] = useState<HTMLElement | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedExample, setSelectedExample] = useState<ExampleGraph | null>(null);
  const [nodeDialogData, setNodeDialogData] = useState<NodeDialogData>({
    label: '',
    description: '',
    nodeType: 'process',
    icon: 'settings',
  });

  const edgeColors = ['#429dbce6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'];

  // Handle node deletion
  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  // Handle node label change
  const handleLabelChange = useCallback((nodeId: string, newLabel: string) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, label: newLabel } }
          : node
      )
    );
  }, [setNodes]);

  // Handle edge label change
  const handleEdgeLabelChange = useCallback((edgeId: string, newLabel: string) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId
          ? { ...edge, data: { ...edge.data, label: newLabel } }
          : edge
      )
    );
  }, [setEdges]);

  // Handle conditional group label change - updates all edges from the same source
  const handleConditionalGroupLabelChange = useCallback((sourceNodeId: string, newLabel: string) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.source === sourceNodeId && edge.data?.isConditional
          ? { ...edge, data: { ...edge.data, label: newLabel } }
          : edge
      )
    );
  }, [setEdges]);

  // Handle canvas click with Cmd/Ctrl key to create nodes
  const onPaneClick = useCallback((event: React.MouseEvent) => {
    if (event.metaKey || event.ctrlKey) {
      // Cmd/Ctrl + click to create a node
      let position;
      
      if (reactFlowInstance) {
        // Use ReactFlow's positioning when instance is available
        position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
      } else {
        // Fallback positioning for when ReactFlow instance isn't ready yet
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        position = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };
      }

      const newNode: Node = {
        id: `node_${Date.now()}`,
        type: 'custom',
        position,
        data: {
          label: `Node ${nodes.length + 1}`,
          description: '',
          nodeType: 'process',
          icon: 'settings',
          colorIndex: nodes.length % 10, // Cycle through the 10 pastel colors
          onDelete: handleDeleteNode,
          onLabelChange: handleLabelChange,
        },
      };

      setNodes((nds) => [...nds, newNode]);
    }
  }, [nodes.length, setNodes, handleDeleteNode, handleLabelChange, reactFlowInstance]);

  // Handle keyboard events
  const onKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't handle delete keys if user is typing in an input field
    const target = event.target as HTMLElement;
    const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    
    if ((event.key === 'Backspace' || event.key === 'Delete') && !isInputFocused) {
      // Delete selected node or edge only if not editing text
      if (selectedNode) {
        setNodes((nds) => nds.filter((node) => node.id !== selectedNode));
        setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode && edge.target !== selectedNode));
        setSelectedNode(null);
      } else if (selectedEdge) {
        setEdges((eds) => {
          const filteredEdges = eds.filter((edge) => edge.id !== selectedEdge);
          
          // Find the source of the deleted edge to recalculate conditional status
          const deletedEdge = eds.find(edge => edge.id === selectedEdge);
          if (deletedEdge) {
            const sourceEdges = filteredEdges.filter(edge => edge.source === deletedEdge.source);
            const shouldBeConditional = sourceEdges.length > 1;
            
            // Update remaining edges from same source if needed
            return filteredEdges.map(edge => {
              if (edge.source === deletedEdge.source) {
                // Preserve the group label if still conditional, clear if not
                const preservedLabel = shouldBeConditional ? (deletedEdge.data?.label || edge.data?.label || 'condition') : undefined;
                return {
                  ...edge,
                  data: {
                    ...edge.data,
                    isConditional: shouldBeConditional,
                    label: preservedLabel,
                    onLabelChange: handleEdgeLabelChange,
                    onGroupLabelChange: handleConditionalGroupLabelChange,
                  }
                };
              }
              return edge;
            });
          }
          
          return filteredEdges;
        });
        setSelectedEdge(null);
      }
    }
  }, [selectedNode, selectedEdge, setNodes, setEdges, handleEdgeLabelChange, handleConditionalGroupLabelChange]);

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown]);

  const onConnect = useCallback(
    (params: Connection) => {
      // Check if source node already has outgoing edges
      const sourceEdges = edges.filter(edge => edge.source === params.source);
      const isConditional = sourceEdges.length > 0;
      
      // Get the existing group label if this is becoming conditional
      let groupLabel = 'condition';
      if (isConditional) {
        const existingConditionalEdge = sourceEdges.find(edge => edge.data?.isConditional);
        if (existingConditionalEdge?.data?.label && typeof existingConditionalEdge.data.label === 'string') {
          groupLabel = existingConditionalEdge.data.label;
        }
      }

      const newEdge = {
        ...params,
        type: 'custom',
        data: { 
          condition: isConditional ? groupLabel : undefined,
          isConditional,
          label: isConditional ? groupLabel : undefined,
          onLabelChange: handleEdgeLabelChange,
          onGroupLabelChange: handleConditionalGroupLabelChange,
        },
      };
      
      // If this makes the source conditional, update existing edges from same source
      if (isConditional) {
        setEdges((eds) => {
          const updatedEdges = eds.map(edge => {
            if (edge.source === params.source && !edge.data?.isConditional) {
              return {
                ...edge,
                data: {
                  ...edge.data,
                  isConditional: true,
                  label: groupLabel,
                  onLabelChange: handleEdgeLabelChange,
                  onGroupLabelChange: handleConditionalGroupLabelChange,
                }
              };
            }
            return edge;
          });
          return addEdge(newEdge, updatedEdges);
        });
      } else {
        setEdges((eds) => addEdge(newEdge, eds));
      }
    },
    [setEdges, edges, handleEdgeLabelChange, handleConditionalGroupLabelChange]
  );

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
    setSelectedEdge(null);
  }, []);

  // Handle edge selection
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge.id);
    setSelectedNode(null);
    // Open color picker for edge coloring
    setColorPickerAnchor(event.currentTarget as HTMLElement);
    setColorPickerOpen(true);
  }, []);

  // Handle edge color change
  const handleEdgeColorChange = useCallback((color: string) => {
    if (selectedEdge) {
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === selectedEdge
            ? { ...edge, style: { ...edge.style, stroke: color } }
            : edge
        )
      );
    }
    setColorPickerOpen(false);
    setColorPickerAnchor(null);
  }, [selectedEdge, setEdges]);

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
        colorIndex: nodes.length % 10, // Cycle through the 10 pastel colors
        onDelete: handleDeleteNode,
        onLabelChange: handleLabelChange,
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
  }, [nodeDialogData, setNodes, nodes.length, handleDeleteNode, handleLabelChange]);

  // Export functions
  const handleExportJSON = useCallback(() => {
    const graphData = GraphExporter.exportToJSON(nodes, edges);
    GraphExporter.downloadJSON(graphData);
  }, [nodes, edges]);

  const handleExportPython = useCallback(() => {
    const graphData = GraphExporter.exportToJSON(nodes, edges);
    const pythonCode = BurrGraphCodeGenerator.generatePythonCode(graphData);
    BurrGraphCodeGenerator.downloadPythonCode(pythonCode);
  }, [nodes, edges]);

  // Example loading functions
  const hasExistingContent = nodes.length > 0 || edges.length > 0;

  const handleLoadExample = useCallback((example: ExampleGraph) => {
    setSelectedExample(example);
    setConfirmDialogOpen(true);
  }, []);

  const handleConfirmLoadExample = useCallback(() => {
    if (!selectedExample) return;

    // Validate example
    const errors = ExampleLoader.validateExample(selectedExample);
    if (errors.length > 0) {
      console.error('Example validation failed:', errors);
      return;
    }

    // Convert and load example
    const { nodes: newNodes, edges: newEdges } = ExampleLoader.convertToReactFlow(selectedExample);
    
    // Add handlers to nodes
    const nodesWithHandlers = newNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onDelete: handleDeleteNode,
        onLabelChange: handleLabelChange,
      },
    }));

    // Add handlers to edges
    const edgesWithHandlers = newEdges.map(edge => ({
      ...edge,
      data: {
        ...edge.data,
        onLabelChange: handleEdgeLabelChange,
        onGroupLabelChange: handleConditionalGroupLabelChange,
      },
    }));

    setNodes(nodesWithHandlers);
    setEdges(edgesWithHandlers);
    setConfirmDialogOpen(false);
    setSelectedExample(null);

    // Fit view after a short delay to ensure nodes are rendered
    setTimeout(() => {
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ padding: 0.1 });
      }
    }, 100);
  }, [selectedExample, handleDeleteNode, handleLabelChange, handleEdgeLabelChange, handleConditionalGroupLabelChange, setNodes, setEdges, reactFlowInstance]);

  const handleCancelLoadExample = useCallback(() => {
    setConfirmDialogOpen(false);
    setSelectedExample(null);
  }, []);

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      {/* Side drawer with instructions */}
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
            Key Commands
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Create a node
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              ⌘ + click anywhere on the canvas
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Create an edge
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              click + drag from the bottom of one node to the top of another
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Create a conditional edge
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              connect one node to multiple nodes (creates animated dashed lines with shared names)
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Edit edge labels
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              click on edge label to edit. Conditional edges from same node share names.
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Create a cycle
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              click + drag from the bottom to the top of a node
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Delete an edge/node
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              click the edge/node and hit the backspace key
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Color an edge
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              click the edge and select an option from the color picker
            </Typography>
          </Box>

          {/* Export Section */}
          <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="h6" gutterBottom>
              Export Graph
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportJSON}
                fullWidth
                sx={{ mb: 1 }}
              >
                Export JSON
              </Button>
              <Typography variant="caption" color="text.secondary">
                Save graph structure as JSON file
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<CodeIcon />}
                onClick={handleExportPython}
                fullWidth
              >
                Generate Burr Code
              </Button>
              <Typography variant="caption" color="text.secondary">
                Generate Python boilerplate code
              </Typography>
            </Box>
          </Box>

          {/* Example Gallery */}
          <ExampleGallery
            examples={examples}
            onLoadExample={handleLoadExample}
          />
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
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          attributionPosition="bottom-left"
          deleteKeyCode="Backspace"
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        </ReactFlow>

        {/* Add Node FAB - Keep for manual addition */}
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

      {/* Color Picker Popover for Edges */}
      <Popover
        open={colorPickerOpen}
        anchorEl={colorPickerAnchor}
        onClose={() => {
          setColorPickerOpen(false);
          setColorPickerAnchor(null);
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Select Edge Color
          </Typography>
          <Grid container spacing={1}>
            {edgeColors.map((color) => (
              <Grid item key={color}>
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    backgroundColor: color,
                    borderRadius: 1,
                    cursor: 'pointer',
                    border: '2px solid transparent',
                    '&:hover': {
                      border: '2px solid #000',
                    },
                  }}
                  onClick={() => handleEdgeColorChange(color)}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Popover>

      {/* Confirm Load Example Dialog */}
      <ConfirmLoadExampleDialog
        open={confirmDialogOpen}
        onClose={handleCancelLoadExample}
        onConfirm={handleConfirmLoadExample}
        exampleTitle={selectedExample?.title || ''}
        hasExistingContent={hasExistingContent}
      />
    </Box>
  );
};

export default GraphBuilder;
