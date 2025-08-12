import { Node, Edge } from '@xyflow/react';

export interface BurrGraphJSON {
  version: string;
  metadata: {
    created: string;
    title?: string;
    description?: string;
  };
  nodes: Array<{
    id: string;
    label: string;
    description?: string;
    nodeType: 'input' | 'action' ;
    position: { x: number; y: number };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    condition?: string;
    isConditional: boolean;
  }>;
}

export class GraphExporter {
  static exportToJSON(nodes: Node[], edges: Edge[]): BurrGraphJSON {
    const exportData: BurrGraphJSON = {
      version: '1.0.0',
      metadata: {
        created: new Date().toISOString(),
        title: 'Burr Graph',
        description: 'Generated from Burr Graph Builder',
      },
      nodes: nodes.map(node => ({
        id: node.id,
        label: (node.data.label as string) || 'Unnamed Node',
        description: (node.data.description as string) || undefined,
        nodeType: this.mapNodeType((node.data.nodeType as string) || 'action'),
        position: node.position,
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        condition: (edge.data?.label as string) || (edge.data?.condition as string) || undefined,
        isConditional: Boolean(edge.data?.isConditional) || false,
      })),
    };

    return exportData;
  }

  private static mapNodeType(nodeType: string): 'input' | 'action' {
    switch (nodeType) {
      case 'input':
        return 'input';
      default:
        return 'action';
    }
  }

  static downloadJSON(data: BurrGraphJSON, filename: string = 'burr-graph.json'): void {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
