import Graph from 'graphology-types';

export type LayoutMapping = { [key: string]: { x: number; y: number } };

export type EdgeMapping = {
  [key: string]: { source: string; target: string; weigth?: number };
};

/**
 * Available options for fruchterman reingold.
 *
 * @property {number=10} iterations
 * @property {number=1} edgeWeightInfluence
 * @property {number=1} speed
 * @property {number=10} gravity
 * @property {number=1} C
 *
 * @export
 * @interface FruchtermanReingoldLayoutOptions
 */
export interface FruchtermanReingoldLayoutOptions {
  iterations: number;
  edgeWeightInfluence: number;
  speed: number;
  gravity: number;
  C: number;
}

export const parseOptions = (
  options: Partial<FruchtermanReingoldLayoutOptions>
): FruchtermanReingoldLayoutOptions => {
  const iterations = options?.iterations || 10;
  const edgeWeightInfluence = options?.edgeWeightInfluence || 1;
  const C = options?.C || 1;
  const speed = options?.speed || 1;
  const gravity = options?.gravity || 10;

  return {
    iterations,
    edgeWeightInfluence,
    C,
    speed,
    gravity,
  };
};

export const parseGraph = (graph: Graph): [string[], EdgeMapping] => {
  const nodes = graph.nodes();
  const edges = graph.edges().reduce(
    (prev, edge) => ({
      ...prev,
      [edge]: {
        source: graph.source(edge),
        target: graph.target(edge),
        weigth: graph.getEdgeAttribute(edge, 'weight'),
      },
    }),
    {} as EdgeMapping
  );
  return [nodes, edges];
};
