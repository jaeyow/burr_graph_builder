// Add Prism namespace for types
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
  MarkerType,
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
  Tabs,
  Tab,
  IconButton,
} from '@mui/material';
// MonacoEditor import removed; now using prism-react-renderer for code highlighting
import { Highlight } from 'prism-react-renderer';
import theme from '../themes/dark';
import {
  Add as AddIcon,
  AccountTree as TreeIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  Help as HelpIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ContentCopy as ContentCopyIcon,
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
const rightDrawerWidth = 300;

// Node types configuration
const nodeTypes: NodeTypes = {
  custom: CustomNode as any,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge as any,
};

// Default edge options with arrow markers
const defaultEdgeOptions = {
  type: 'custom',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 15,
    height: 15,
    color: '#429dbce6',
  },
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
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
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
  const [tabIndex, setTabIndex] = useState(0);
  const [copied, setCopied] = useState<'python' | 'json' | null>(null);

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
          ? { ...edge, data: { ...edge.data, label: newLabel, condition: newLabel } }
          : edge
      )
    );
  }, [setEdges]);

  // Handle conditional group label change - updates all edges from the same source
  // No longer needed: group label editing
  const handleConditionalGroupLabelChange = useCallback((_sourceNodeId: string, _newLabel: string) => {
    // No-op: group label editing is disabled
  }, []);

  // Handle canvas click with Cmd/Ctrl key to create nodes
  const onPaneClick = useCallback((event: React.MouseEvent) => {
    if (event.metaKey || event.ctrlKey) {
      // Determine node type based on mouse button
      const isRightClick = event.button === 2 || event.type === 'contextmenu';
      const nodeType = isRightClick ? 'input' : 'process';
      const nodeLabel = isRightClick ? `Input ${nodes.length + 1}` : `Node ${nodes.length + 1}`;
      
      // Cmd/Ctrl + click to create a process node
      // Cmd/Ctrl + right-click to create an input node
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
          label: nodeLabel,
          description: '',
          nodeType: nodeType,
          icon: 'settings',
          colorIndex: nodes.length % 10, // Cycle through the 10 pastel colors
          onDelete: handleDeleteNode,
          onLabelChange: handleLabelChange,
        },
      };

      setNodes((nds) => [...nds, newNode]);
      
      // Prevent default context menu on right-click
      if (isRightClick) {
        event.preventDefault();
      }
    }
  }, [nodes.length, setNodes, handleDeleteNode, handleLabelChange, reactFlowInstance]);

  // Handle context menu (right-click) for input node creation
  const onPaneContextMenu = useCallback((event: React.MouseEvent | MouseEvent) => {
    const reactEvent = event as React.MouseEvent;
    if (reactEvent.metaKey || reactEvent.ctrlKey) {
      onPaneClick(reactEvent);
    }
  }, [onPaneClick]);

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
      const willBeConditional = sourceEdges.length > 0;

      // Find the target node's label
      const targetNode = nodes.find(node => node.id === params.target);
      const targetLabel = targetNode?.data?.label || params.target;
      const conditionString = `condition="${targetLabel}"`;

      const newEdge = {
        ...params,
        type: 'custom',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
          color: '#429dbce6',
        },
        data: { 
          condition: willBeConditional ? conditionString : undefined,
          isConditional: willBeConditional,
          label: willBeConditional ? conditionString : undefined,
          onLabelChange: handleEdgeLabelChange,
          onGroupLabelChange: handleConditionalGroupLabelChange,
        },
      };
      
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, edges, nodes, handleEdgeLabelChange, handleConditionalGroupLabelChange]
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

  // Toggle isConditional for an edge in a group
  const handleToggleConditional = useCallback(() => {
    if (!selectedEdge) return;
    setEdges((eds) => {
      const targetEdge = eds.find(e => e.id === selectedEdge);
      if (!targetEdge) return eds;
      const source = targetEdge.source;
      const target = targetEdge.target;
      const groupEdges = eds.filter(e => e.source === source);
      const toggledIsConditional = !targetEdge.data?.isConditional;

      // Find the target node's label
      const targetNode = nodes.find(node => node.id === target);
      const targetLabel = targetNode?.data?.label || target;
      const conditionString = `condition="${targetLabel}"`;

      return eds.map(edge => {
        if (edge.id === selectedEdge) {
          return {
            ...edge,
            data: {
              ...edge.data,
              isConditional: toggledIsConditional,
              // If toggling to conditional, set condition/label to condition="node name"
              condition: toggledIsConditional ? conditionString : undefined,
              label: toggledIsConditional ? conditionString : undefined,
            }
          };
        }
        // If toggling OFF, recalculate group conditional status
        if (edge.source === source && edge.id !== selectedEdge) {
          // If only one edge left as conditional, set it to false
          if (!toggledIsConditional) {
            const stillConditional = groupEdges.filter(e => e.id !== selectedEdge && e.data?.isConditional).length > 1;
            return {
              ...edge,
              data: {
                ...edge.data,
                isConditional: stillConditional,
              }
            };
          }
        }
        return edge;
      });
    });
    setColorPickerOpen(false);
    setColorPickerAnchor(null);
  }, [selectedEdge, setEdges, nodes]);

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

  // Generate code for tabs
  const graphData = GraphExporter.exportToJSON(nodes, edges);
  const pythonCode = BurrGraphCodeGenerator.generatePythonCode(graphData);
  const jsonCode = JSON.stringify(graphData, null, 2);

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
    <Box sx={{ display: 'flex', height: 'calc(100vh - 32px)', mb: 4 }}>
      {/* Side drawer with instructions */}
      <Drawer
        variant="permanent"
        sx={{
          width: leftOpen ? drawerWidth : 48,
          flexShrink: 0,
          height: 'calc(100vh - 32px)',
          transition: 'width 0.2s',
          '& .MuiDrawer-paper': {
            width: leftOpen ? drawerWidth : 48,
            boxSizing: 'border-box',
            position: 'relative',
            height: 'calc(100vh - 32px)',
            transition: 'width 0.2s',
            overflowX: 'hidden',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: leftOpen ? 'flex-end' : 'center', p: 1 }}>
          <IconButton onClick={() => setLeftOpen(!leftOpen)} size="small">
            {leftOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </Box>
        {leftOpen && (
          <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Key Commands
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Create a process node
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              ⌘ + click anywhere on the canvas
            </Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Create an input node
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              ⌘ + right-click anywhere on the canvas
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
              click on edge label to edit. Each edge has its own independent label.
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
          </Box>
        )}
      </Drawer>

      {/* Main tabbed area */}
      <Box sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flex: 1,
        paddingBottom: '60px', // Add bottom padding to prevent clipping
        transition: 'margin 0.2s',
      }}>
        <Box sx={{ pb: 1 }}>
          <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} variant="fullWidth">
            <Tab label="Canvas" value={0} />
            <Tab label="Python" value={1} />
            <Tab label="JSON" value={2} />
          </Tabs>
        </Box>
        <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
          {tabIndex === 0 && (
            <Box sx={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                onPaneClick={onPaneClick}
                onPaneContextMenu={onPaneContextMenu}
                onInit={setReactFlowInstance}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                defaultViewport={{ x: 0, y: 0, zoom: 1.0 }}
                attributionPosition="bottom-left"
                deleteKeyCode="Backspace"
              >
                <Controls />
                <MiniMap />
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
              </ReactFlow>
              <Fab
                color="primary"
                aria-label="add node"
                sx={{ position: 'absolute', bottom: 16, right: 16 }}
                onClick={handleAddNode}
              >
                <AddIcon />
              </Fab>
            </Box>
          )}
          {tabIndex === 1 && (
            <Box sx={{ width: '100%', height: '100%', overflow: 'auto', background: '#282a36', display: 'flex', flexDirection: 'column', position: 'relative' }}>
    <Box sx={{ position: 'absolute', top: 8, right: 20, zIndex: 2, background: 'rgba(255,255,255,0.85)', borderRadius: 1 }}>
      <IconButton
        color={copied === 'python' ? 'success' : 'primary'}
        size="small"
        onClick={async () => {
          await navigator.clipboard.writeText(pythonCode);
          setCopied('python');
          setTimeout(() => setCopied(null), 1200);
        }}
        aria-label="Copy Python code"
      >
        <ContentCopyIcon />
      </IconButton>
    </Box>
              <Highlight code={pythonCode} language="python" theme={theme}>
                {({ className, style, tokens, getLineProps, getTokenProps }: any) => (
                  <pre
                    className={className}
                    style={{
                      ...style,
                      margin: 0,
                      padding: 16,
                      fontSize: 14,
                      borderRadius: 4,
                      height: '100%',
                      boxSizing: 'border-box',
                      overflow: 'auto',
                    }}
                  >
                    {tokens.map((line: any, i: number) => {
                      const lineProps = getLineProps({ line });
                      return (
                        <div key={i} {...lineProps}>
                          {line.map((token: any, key: number) => {
                            const tokenProps = getTokenProps({ token });
                            return <span key={key} {...tokenProps} />;
                          })}
                        </div>
                      );
                    })}
                  </pre>
                )}
              </Highlight>
            </Box>
          )}
          {tabIndex === 2 && (
            <Box sx={{ width: '100%', height: '100%', overflow: 'auto', background: '#282a36', display: 'flex', flexDirection: 'column', position: 'relative' }}>
    <Box sx={{ position: 'absolute', top: 8, right: 20, zIndex: 2, background: 'rgba(255,255,255,0.85)', borderRadius: 1 }}>
      <IconButton
        color={copied === 'json' ? 'success' : 'primary'}
        size="small"
        onClick={async () => {
          await navigator.clipboard.writeText(jsonCode);
          setCopied('json');
          setTimeout(() => setCopied(null), 1200);
        }}
        aria-label="Copy JSON code"
      >
        <ContentCopyIcon />
      </IconButton>
    </Box>
              <Highlight code={jsonCode} language="json" theme={theme}>
                {({ className, style, tokens, getLineProps, getTokenProps }: any) => (
                  <pre
                    className={className}
                    style={{
                      ...style,
                      margin: 0,
                      padding: 16,
                      fontSize: 14,
                      borderRadius: 4,
                      height: '100%',
                      boxSizing: 'border-box',
                      overflow: 'auto',
                    }}
                  >
                    {tokens.map((line: any, i: number) => (
                      <div key={i} {...getLineProps({ line, key: i })}>
                        {line.map((token: any, key: number) => (
                          <span key={key} {...getTokenProps({ token, key })} />
                        ))}
                      </div>
                    ))}
                  </pre>
                )}
              </Highlight>
            </Box>
          )}
        </Box>
      </Box>

      {/* Right panel: ExampleGallery only */}
      <Box sx={{ width: rightOpen ? rightDrawerWidth : 48, height: '100%', background: '#fff', boxShadow: 2, zIndex: 10, transition: 'width 0.2s', overflowX: 'hidden' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: rightOpen ? 'flex-start' : 'center', p: 1 }}>
          <IconButton onClick={() => setRightOpen(!rightOpen)} size="small">
            {rightOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>
        {rightOpen && (
          <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
            <ExampleGallery
              examples={examples}
              onLoadExample={handleLoadExample}
            />
          </Box>
        )}
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
          {/* Conditional toggle for grouped edges */}
          {(() => {
            if (!selectedEdge) return null;
            const selected = edges.find(e => e.id === selectedEdge);
            if (!selected) return null;
            const groupEdges = edges.filter(e => e.source === selected.source);
            if (groupEdges.length > 1) {
              return (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant={selected.data?.isConditional ? 'contained' : 'outlined'}
                    color={selected.data?.isConditional ? 'primary' : 'inherit'}
                    onClick={handleToggleConditional}
                    fullWidth
                  >
                    {selected.data?.isConditional ? 'Make Default' : 'Make Conditional'}
                  </Button>
                </Box>
              );
            }
            return null;
          })()}
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
