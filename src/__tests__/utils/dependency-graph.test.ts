import { DependencyGraph } from '../../utils/dependency-graph';

describe('DependencyGraph', () => {
  let graph: DependencyGraph;

  beforeEach(() => {
    graph = new DependencyGraph();
  });

  test('should add and get nodes', () => {
    // Add a node
    const node = graph.addNode('/test/file.md', 123456789);

    // Verify the node
    expect(node).toBeDefined();
    expect(node.path).toBe('/test/file.md');
    expect(node.lastModified).toBe(123456789);
    expect(node.changed).toBe(false);
    expect(node.dependencies.size).toBe(0);
    expect(node.dependents.size).toBe(0);
    expect(node.outputs.size).toBe(0);

    // Get the node
    const retrievedNode = graph.getNode('/test/file.md');
    expect(retrievedNode).toBe(node);
  });

  test('should update existing nodes', () => {
    // Add a node
    const node1 = graph.addNode('/test/file.md', 123456789);

    // Add the same node with a different last modified time
    const node2 = graph.addNode('/test/file.md', 987654321);

    // Verify that the node was updated
    expect(node2).toBe(node1);
    expect(node2.lastModified).toBe(987654321);
  });

  test('should remove nodes', () => {
    // Add a node
    graph.addNode('/test/file.md', 123456789);

    // Remove the node
    graph.removeNode('/test/file.md');

    // Verify that the node was removed
    expect(graph.getNode('/test/file.md')).toBeUndefined();
  });

  test('should add dependencies between nodes', () => {
    // Add a dependency
    graph.addDependency('/test/file1.md', '/test/file2.md', 123456789, 987654321);

    // Verify the nodes
    const node1 = graph.getNode('/test/file1.md');
    const node2 = graph.getNode('/test/file2.md');

    expect(node1).toBeDefined();
    expect(node2).toBeDefined();
    expect(node1?.dependencies.has('/test/file2.md')).toBe(true);
    expect(node2?.dependents.has('/test/file1.md')).toBe(true);
  });

  test('should add output files', () => {
    // Add an output
    graph.addOutput('/test/file.md', '/test/output.html', 123456789);

    // Verify the node
    const node = graph.getNode('/test/file.md');
    expect(node).toBeDefined();
    expect(node?.outputs.has('/test/output.html')).toBe(true);
  });

  test('should mark nodes as changed', () => {
    // Add a node
    graph.addNode('/test/file.md', 123456789);

    // Mark the node as changed
    graph.markChanged('/test/file.md', 987654321);

    // Verify the node
    const node = graph.getNode('/test/file.md');
    expect(node).toBeDefined();
    expect(node?.changed).toBe(true);
    expect(node?.lastModified).toBe(987654321);
  });

  test('should get files to regenerate', () => {
    // Add nodes and dependencies
    graph.addDependency('/test/file1.md', '/test/file2.md', 123456789, 987654321);
    graph.addDependency('/test/file3.md', '/test/file1.md', 123456789, 987654321);
    graph.addNode('/test/file4.md', 123456789);

    // Mark a node as changed
    graph.markChanged('/test/file2.md', 987654321);

    // Get files to regenerate
    const filesToRegenerate = graph.getFilesToRegenerate();

    // Verify the result
    expect(filesToRegenerate).toContain('/test/file2.md');
    expect(filesToRegenerate).toContain('/test/file1.md');
    expect(filesToRegenerate).toContain('/test/file3.md');
    expect(filesToRegenerate).not.toContain('/test/file4.md');
  });

  test('should get outputs to regenerate', () => {
    // Add nodes, dependencies, and outputs
    graph.addDependency('/test/file1.md', '/test/file2.md', 123456789, 987654321);
    graph.addOutput('/test/file1.md', '/test/output1.html', 123456789);
    graph.addOutput('/test/file2.md', '/test/output2.html', 987654321);
    graph.addNode('/test/file3.md', 123456789);
    graph.addOutput('/test/file3.md', '/test/output3.html', 123456789);

    // Mark a node as changed
    graph.markChanged('/test/file2.md', 987654321);

    // Get outputs to regenerate
    const outputsToRegenerate = graph.getOutputsToRegenerate();

    // Verify the result
    expect(outputsToRegenerate).toContain('/test/output1.html');
    expect(outputsToRegenerate).toContain('/test/output2.html');
    expect(outputsToRegenerate).not.toContain('/test/output3.html');
  });

  test('should reset changed state', () => {
    // Add nodes
    graph.addNode('/test/file1.md', 123456789);
    graph.addNode('/test/file2.md', 987654321);

    // Mark nodes as changed
    graph.markChanged('/test/file1.md', 123456789);
    graph.markChanged('/test/file2.md', 987654321);

    // Reset changed state
    graph.resetChangedState();

    // Verify the nodes
    const node1 = graph.getNode('/test/file1.md');
    const node2 = graph.getNode('/test/file2.md');
    expect(node1?.changed).toBe(false);
    expect(node2?.changed).toBe(false);
  });

  test('should get all nodes', () => {
    // Add nodes
    graph.addNode('/test/file1.md', 123456789);
    graph.addNode('/test/file2.md', 987654321);

    // Get all nodes
    const nodes = graph.getAllNodes();

    // Verify the result
    expect(nodes).toHaveLength(2);
    expect(nodes[0].path).toBe('/test/file1.md');
    expect(nodes[1].path).toBe('/test/file2.md');
  });

  test('should get the size of the graph', () => {
    // Add nodes
    graph.addNode('/test/file1.md', 123456789);
    graph.addNode('/test/file2.md', 987654321);

    // Get the size
    const size = graph.size();

    // Verify the result
    expect(size).toBe(2);
  });

  test('should clear the graph', () => {
    // Add nodes
    graph.addNode('/test/file1.md', 123456789);
    graph.addNode('/test/file2.md', 987654321);

    // Clear the graph
    graph.clear();

    // Verify the result
    expect(graph.size()).toBe(0);
    expect(graph.getAllNodes()).toHaveLength(0);
  });

  test('should serialize and deserialize the graph', () => {
    // Add nodes, dependencies, and outputs
    graph.addDependency('/test/file1.md', '/test/file2.md', 123456789, 987654321);
    graph.addOutput('/test/file1.md', '/test/output1.html', 123456789);
    graph.addOutput('/test/file2.md', '/test/output2.html', 987654321);

    // Serialize the graph
    const json = graph.toJSON();

    // Deserialize the graph
    const newGraph = DependencyGraph.fromJSON(json);

    // Verify the result
    expect(newGraph.size()).toBe(2);

    const node1 = newGraph.getNode('/test/file1.md');
    const node2 = newGraph.getNode('/test/file2.md');

    expect(node1).toBeDefined();
    expect(node2).toBeDefined();
    expect(node1?.dependencies.has('/test/file2.md')).toBe(true);
    expect(node2?.dependents.has('/test/file1.md')).toBe(true);
    expect(node1?.outputs.has('/test/output1.html')).toBe(true);
    expect(node2?.outputs.has('/test/output2.html')).toBe(true);
  });
});
