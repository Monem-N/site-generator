/**
 * A node in the dependency graph
 */
export interface DependencyNode {
  /**
   * The file path
   */
  path: string;

  /**
   * The dependencies of this node
   */
  dependencies: Set<string>;

  /**
   * The dependents of this node (files that depend on this node)
   */
  dependents: Set<string>;

  /**
   * The last modified time of the file
   */
  lastModified: number;

  /**
   * Whether the file has changed since the last build
   */
  changed: boolean;

  /**
   * The output files generated from this node
   */
  outputs: Set<string>;
}

/**
 * A graph of dependencies between files
 */
export class DependencyGraph {
  /**
   * The nodes in the graph
   */
  private nodes: Map<string, DependencyNode> = new Map();

  /**
   * Add a node to the graph
   * @param path The file path
   * @param lastModified The last modified time of the file
   * @returns The node
   */
  addNode(path: string, lastModified: number): DependencyNode {
    const existingNode = this.nodes.get(path);

    if (existingNode) {
      // Update the last modified time
      existingNode.lastModified = lastModified;
      return existingNode;
    }

    // Create a new node
    const node: DependencyNode = {
      path,
      dependencies: new Set(),
      dependents: new Set(),
      lastModified,
      changed: false,
      outputs: new Set(),
    };

    this.nodes.set(path, node);
    return node;
  }

  /**
   * Get a node from the graph
   * @param path The file path
   * @returns The node, or undefined if it doesn't exist
   */
  getNode(path: string): DependencyNode | undefined {
    return this.nodes.get(path);
  }

  /**
   * Remove a node from the graph
   * @param path The file path
   */
  removeNode(path: string): void {
    const node = this.nodes.get(path);

    if (!node) {
      return;
    }

    // Remove this node from its dependencies' dependents
    for (const dependency of node.dependencies) {
      const dependencyNode = this.nodes.get(dependency);
      if (dependencyNode) {
        dependencyNode.dependents.delete(path);
      }
    }

    // Remove this node from its dependents' dependencies
    for (const dependent of node.dependents) {
      const dependentNode = this.nodes.get(dependent);
      if (dependentNode) {
        dependentNode.dependencies.delete(path);
      }
    }

    // Remove the node
    this.nodes.delete(path);
  }

  /**
   * Add a dependency between two nodes
   * @param from The dependent file path
   * @param to The dependency file path
   * @param fromLastModified The last modified time of the dependent file
   * @param toLastModified The last modified time of the dependency file
   */
  addDependency(from: string, to: string, fromLastModified: number, toLastModified: number): void {
    // Add the nodes if they don't exist
    const fromNode = this.addNode(from, fromLastModified);
    const toNode = this.addNode(to, toLastModified);

    // Add the dependency
    fromNode.dependencies.add(to);
    toNode.dependents.add(from);
  }

  /**
   * Add an output file for a node
   * @param from The source file path
   * @param output The output file path
   * @param fromLastModified The last modified time of the source file
   */
  addOutput(from: string, output: string, fromLastModified: number): void {
    // Add the node if it doesn't exist
    const fromNode = this.addNode(from, fromLastModified);

    // Add the output
    fromNode.outputs.add(output);
  }

  /**
   * Mark a node as changed
   * @param path The file path
   * @param lastModified The new last modified time of the file
   */
  markChanged(path: string, lastModified: number): void {
    const node = this.nodes.get(path);

    if (!node) {
      return;
    }

    // Update the last modified time and mark as changed
    node.lastModified = lastModified;
    node.changed = true;
  }

  /**
   * Get all files that need to be regenerated
   * @returns The files that need to be regenerated
   */
  getFilesToRegenerate(): string[] {
    const result = new Set<string>();

    // First, add all changed files
    for (const [path, node] of this.nodes.entries()) {
      if (node.changed) {
        result.add(path);
      }
    }

    // Then, add all files that depend on changed files
    let added = true;
    while (added) {
      added = false;

      for (const [path, node] of this.nodes.entries()) {
        if (result.has(path)) {
          continue;
        }

        // Check if any of this node's dependencies have changed
        for (const dependency of node.dependencies) {
          if (result.has(dependency)) {
            result.add(path);
            added = true;
            break;
          }
        }
      }
    }

    return Array.from(result);
  }

  /**
   * Get all output files that need to be regenerated
   * @returns The output files that need to be regenerated
   */
  getOutputsToRegenerate(): string[] {
    const result = new Set<string>();
    const filesToRegenerate = this.getFilesToRegenerate();

    // Add all outputs of files that need to be regenerated
    for (const path of filesToRegenerate) {
      const node = this.nodes.get(path);
      if (node) {
        for (const output of node.outputs) {
          result.add(output);
        }
      }
    }

    return Array.from(result);
  }

  /**
   * Reset the changed state of all nodes
   */
  resetChangedState(): void {
    for (const node of this.nodes.values()) {
      node.changed = false;
    }
  }

  /**
   * Get all nodes in the graph
   * @returns All nodes in the graph
   */
  getAllNodes(): DependencyNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get the number of nodes in the graph
   * @returns The number of nodes
   */
  size(): number {
    return this.nodes.size;
  }

  /**
   * Clear the graph
   */
  clear(): void {
    this.nodes.clear();
  }

  /**
   * Serialize the graph to JSON
   * @returns The serialized graph
   */
  toJSON(): Record<string, unknown> {
    const nodes: Record<
      string,
      {
        dependencies: string[];
        dependents: string[];
        lastModified: number;
        outputs: string[];
      }
    > = {};

    for (const [path, node] of this.nodes.entries()) {
      nodes[path] = {
        dependencies: Array.from(node.dependencies),
        dependents: Array.from(node.dependents),
        lastModified: node.lastModified,
        outputs: Array.from(node.outputs),
      };
    }

    return { nodes };
  }

  /**
   * Deserialize the graph from JSON
   * @param json The serialized graph
   * @returns The deserialized graph
   */
  static fromJSON(json: Record<string, unknown>): DependencyGraph {
    const graph = new DependencyGraph();

    if (!json.nodes || typeof json.nodes !== 'object') {
      return graph;
    }

    const nodes = json.nodes as Record<
      string,
      {
        dependencies: string[];
        dependents: string[];
        lastModified: number;
        outputs: string[];
      }
    >;

    // First, add all nodes
    for (const [path, nodeData] of Object.entries(nodes)) {
      graph.addNode(path, nodeData.lastModified);
    }

    // Then, add all dependencies and outputs
    for (const [path, nodeData] of Object.entries(nodes)) {
      const node = graph.getNode(path);

      if (!node) {
        continue;
      }

      // Add dependencies
      for (const dependency of nodeData.dependencies) {
        const dependencyNode = graph.getNode(dependency);

        if (dependencyNode) {
          node.dependencies.add(dependency);
          dependencyNode.dependents.add(path);
        }
      }

      // Add outputs
      for (const output of nodeData.outputs) {
        node.outputs.add(output);
      }
    }

    return graph;
  }
}
