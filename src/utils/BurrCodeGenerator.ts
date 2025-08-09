import { BurrGraphJSON } from './GraphExporter';

export class BurrGraphCodeGenerator {
  static generatePythonCode(graphData: BurrGraphJSON): string {
    const imports = this.generateImports();
    const actions = this.generateActions(graphData.nodes);
    const graphFunction = this.generateGraphFunction(graphData);
    const main = this.generateMain();

    return [imports, actions, graphFunction, main].join('\n\n');
  }

  private static generateImports(): string {
    return `from typing import Tuple
from burr.core import State, default, when
from burr.core.action import action
from burr.core.graph import GraphBuilder`;
  }

  private static generateActions(nodes: BurrGraphJSON['nodes']): string {
    const actionFunctions = nodes.map(node => {
      const functionName = this.sanitizeNodeName(node.label);
      const description = node.description ? `\n    """${node.description}"""` : '';
      
      return `@action(reads=[], writes=[])
def ${functionName}(state: State) -> Tuple[dict, State]:${description}
    return {}, state`;
    });

    return actionFunctions.join('\n\n');
  }

  private static generateGraphFunction(graphData: BurrGraphJSON): string {
    const actionNames = graphData.nodes.map(node => this.sanitizeNodeName(node.label));
    const transitions = this.generateTransitions(graphData);

    const actionsString = actionNames.map(name => `          ${name},`).join('\n');

    return `def create_burr_graph():
    """Create the Burr graph for the project."""
    return (
        GraphBuilder()
        .with_actions(
${actionsString}
        )
        .with_transitions(
${transitions}
        )
        .build()
    )`;
  }

  private static generateTransitions(graphData: BurrGraphJSON): string {
    const transitions: string[] = [];
    
    // Group edges by source node to handle conditional logic
    const edgesBySource = new Map<string, BurrGraphJSON['edges']>();
    graphData.edges.forEach(edge => {
      if (!edgesBySource.has(edge.source)) {
        edgesBySource.set(edge.source, []);
      }
      edgesBySource.get(edge.source)!.push(edge);
    });

    // Generate transitions
    edgesBySource.forEach((edges, sourceId) => {
      const sourceNode = graphData.nodes.find(n => n.id === sourceId);
      if (!sourceNode) return;

      const sourceName = this.sanitizeNodeName(sourceNode.label);

      if (edges.length === 1) {
        // Simple transition
        const edge = edges[0];
        const targetNode = graphData.nodes.find(n => n.id === edge.target);
        if (targetNode) {
          const targetName = this.sanitizeNodeName(targetNode.label);
          transitions.push(`            ("${sourceName}", "${targetName}", default),`);
        }
      } else {
        // Conditional transitions
        const conditionalEdges = edges.filter(e => e.isConditional && e.condition);
        const defaultEdges = edges.filter(e => !e.isConditional || !e.condition);

        // Add conditional transitions
        conditionalEdges.forEach(edge => {
          const targetNode = graphData.nodes.find(n => n.id === edge.target);
          if (targetNode && edge.condition) {
            const targetName = this.sanitizeNodeName(targetNode.label);
            const conditionName = this.sanitizeConditionName(edge.condition);
            transitions.push(`            ("${sourceName}", "${targetName}", when(${conditionName}=True)),`);
          }
        });

        // Add default transition if exists
        if (defaultEdges.length > 0) {
          const defaultEdge = defaultEdges[0]; // Take first default edge
          const targetNode = graphData.nodes.find(n => n.id === defaultEdge.target);
          if (targetNode) {
            const targetName = this.sanitizeNodeName(targetNode.label);
            transitions.push(`            ("${sourceName}", "${targetName}", default),`);
          }
        }
      }
    });

    // Check for nodes that need to return to a common node (like the prompt pattern in your example)
    const returnTransitions = this.generateReturnTransitions(graphData);
    if (returnTransitions) {
      transitions.push(returnTransitions);
    }

    return transitions.join('\n');
  }

  private static generateReturnTransitions(graphData: BurrGraphJSON): string | null {
    // Find nodes that have no outgoing edges (end nodes)
    const endNodes = graphData.nodes.filter(node => 
      !graphData.edges.some(edge => edge.source === node.id)
    );

    // Find start node (or most connected input node)
    const startNode = graphData.nodes.find(node => node.nodeType === 'start') ||
                     graphData.nodes.find(node => 
                       !graphData.edges.some(edge => edge.target === node.id)
                     );

    if (endNodes.length > 1 && startNode) {
      const endNodeNames = endNodes.map(node => `"${this.sanitizeNodeName(node.label)}"`);
      const startNodeName = this.sanitizeNodeName(startNode.label);
      
      return `            (
                [
${endNodeNames.map(name => `                    ${name},`).join('\n')}
                ],
                "${startNodeName}",
            ),`;
    }

    return null;
  }

  private static generateMain(): string {
    return `graph = create_burr_graph()

if __name__ == "__main__":
    print("Burr graph created successfully.")
    print(graph)
    # You can now use \`graph\` in your Burr application.`;
  }

  private static sanitizeNodeName(label: string): string {
    // Convert label to valid Python function name
    return label
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      || 'unnamed_node';
  }

  private static sanitizeConditionName(condition: string): string {
    // Convert condition to valid Python variable name
    return condition
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      || 'condition';
  }

  static downloadPythonCode(code: string, filename: string = 'burr_graph.py'): void {
    const blob = new Blob([code], { type: 'text/x-python' });
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
