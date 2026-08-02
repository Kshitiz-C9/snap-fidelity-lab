export type Step = {
  label: string;
  narration: string;
  visual: string;
  entities: string[];
};

export type VideoData = {
  title: string;
  summary: string;
  steps: Step[];
};

export const videoData: VideoData = {
  title: "Dijkstra's Shortest Path Algorithm",
  summary:
    "How a greedy min-priority queue finds the shortest route through a weighted graph.",
  steps: [
    {
      label: "Initialization",
      narration:
        "Dijkstra's algorithm begins at a designated source node in a weighted graph, initializing distance estimates to all other nodes while preparing a min-priority queue.",
      visual: "Source node at distance zero, every other node still unknown.",
      entities: ["source_node", "weighted_graph", "distance_estimates"],
    },
    {
      label: "Min-Priority Queue Extraction",
      narration:
        "The algorithm repeatedly extracts the unvisited node with the smallest distance label, selecting the most promising shortest path candidate discovered so far.",
      visual: "The queue pops the closest unvisited node.",
      entities: ["min_priority_queue", "unvisited_node", "shortest_path"],
    },
    {
      label: "Edge Traversal and Relaxation",
      narration:
        "Traversing outgoing edges, the algorithm calculates tentative distances to neighbours — non-negative weights keep distance labels monotonically non-decreasing.",
      visual: "Weighted edges flash as shorter candidates are computed.",
      entities: ["weighted_edges", "neighboring_nodes", "distance_label"],
    },
    {
      label: "Queue Update and Optimization",
      narration:
        "If a shorter path to a neighbour is found, its distance record is updated in the queue. Structures like Fibonacci heaps make those updates dramatically cheaper.",
      visual: "Quadratic time versus Fibonacci heap time.",
      entities: ["fibonacci_heap", "priority_queue", "time_complexity"],
    },
    {
      label: "Termination and Application",
      narration:
        "The process repeats until every reachable node is processed, yielding a shortest-path tree that powers routing protocols like OSPF and IS-IS.",
      visual: "The complete shortest-path tree across the network.",
      entities: ["destination_node", "shortest_path_tree", "network_routing"],
    },
  ],
};