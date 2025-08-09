import { Node, Edge } from '@xyflow/react';
import { ExampleGraph } from '../data/examples';

export class ExampleLoader {
  static convertToReactFlow(example: ExampleGraph): { nodes: Node[], edges: Edge[] } {
    // Convert nodes
    const nodes: Node[] = example.nodes.map((node, index) => ({
      id: node.id,
      type: 'custom',
      position: node.position,
      data: {
        label: node.label,
        description: node.description || '',
        nodeType: node.nodeType,
        icon: 'settings',
        colorIndex: index % 10, // Use different colors for visual variety
        onDelete: undefined, // Will be set by GraphBuilder
        onLabelChange: undefined, // Will be set by GraphBuilder
      },
    }));

    // Convert edges
    const edges: Edge[] = example.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'custom',
      data: {
        condition: edge.condition,
        isConditional: edge.isConditional,
        label: edge.condition,
        onLabelChange: undefined, // Will be set by GraphBuilder
        onGroupLabelChange: undefined, // Will be set by GraphBuilder
      },
    }));

    return { nodes, edges };
  }

  static validateExample(example: ExampleGraph): string[] {
    const errors: string[] = [];

    // Check if all edge sources and targets exist as nodes
    const nodeIds = new Set(example.nodes.map(n => n.id));
    
    example.edges.forEach(edge => {
      if (!nodeIds.has(edge.source)) {
        errors.push(`Edge ${edge.id} references non-existent source node: ${edge.source}`);
      }
      if (!nodeIds.has(edge.target)) {
        errors.push(`Edge ${edge.id} references non-existent target node: ${edge.target}`);
      }
    });

    // Check for duplicate node IDs
    const uniqueNodeIds = new Set();
    example.nodes.forEach(node => {
      if (uniqueNodeIds.has(node.id)) {
        errors.push(`Duplicate node ID: ${node.id}`);
      }
      uniqueNodeIds.add(node.id);
    });

    // Check for duplicate edge IDs
    const uniqueEdgeIds = new Set();
    example.edges.forEach(edge => {
      if (uniqueEdgeIds.has(edge.id)) {
        errors.push(`Duplicate edge ID: ${edge.id}`);
      }
      uniqueEdgeIds.add(edge.id);
    });

    return errors;
  }
}
