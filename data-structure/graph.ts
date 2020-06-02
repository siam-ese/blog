// 1.数据结构 graph 图

class GraphNode {
  public value: any;
  public edages?: GraphNode[];
  constructor(value: any) {
    this.value = value;
  }
  setEdages(edages: GraphNode[]) {
    this.edages = edages;
  }
}

type GraphPaths = {
  [key: number]: number[];
};

class Graph {
  public size: number;
  public nodes: { [key: number]: GraphNode };
  public flatNodes: GraphNode[];
  constructor(values: any[], paths: GraphPaths) {
    this.size = values.length;
    this.nodes = {};
    const flatNodes = (this.flatNodes = values.map(
      (value) => new GraphNode(value)
    ));

    for (let key in paths) {
      const node = flatNodes[key];
      node.setEdages(paths[key].map((i) => flatNodes[i]));

      this.nodes[key] = node;
    }
  }
  get(key: number) {
    return this.nodes[key];
  }
  findIndex(node: GraphNode) {
    return this.flatNodes.findIndex((n) => n === node);
  }
}
// 广度遍历
function bfs(g: Graph, s: number, t: number) {
  const visited: boolean[] = new Array<boolean>(g.size).fill(false); // 声明一个数组查看是否已经遍历过该节点
  const queue: GraphNode[] = []; // 声明一个队列先进先出 用队列装载需要遍历的顶点的边
  queue.push(g.get(s));

  const target = g.get(t);
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    visited[g.findIndex(current)] = true;
    const edages = current.edages;

    if (edages) {
      for (let i = 0; i < edages.length; i++) {
        const edage = edages[i];
        if (visited[g.findIndex(edage)]) continue;
        else if (target === edage) return edage;
        // 没有遍历过的顶点就加入栈进行遍历 每次只走一步 一层一层的遍历
        queue.push(edage);
      }
    }
  }
}
// 深度遍历
function dfs(start: GraphNode, target: number): GraphNode | void {
  const visited: GraphNode[] = []; // 声明一个数组查看是否已经遍历过该节点
  let result: GraphNode;

  function _dfs(s: GraphNode, t: number) {
    if (result) return;
    if (visited.indexOf(s) === -1) visited.push(s);

    let { edages } = s;
    edages = (edages || []).slice();
    while (edages.length > 0) {
      const edage = edages.shift(); // 从队列中弹出一个顶点进行遍历

      if (edage) {
        if (visited.indexOf(edage) !== -1) continue;
        if (edage.value === t) {
          result = edage;
        } else {
          // 深度遍历 继续往该顶点链接的边去查找
          _dfs(edage, t);
        }
      }
    }
  }
  _dfs(start, target);
  return result!;
}
