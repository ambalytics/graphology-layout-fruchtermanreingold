import Graph from 'graphology-types';
import { isGraph } from 'graphology-utils';

type LayoutMapping = { [key: string]: { x: number; y: number } };


/**
 * Available options for fruchterman reingold.
 * 
 * @property {number=10} iterations
 * @property {number=1} edgeWeightInfluence
 *
 * @export
 * @interface FruchtermanReingoldLayoutOptions
 */
export interface FruchtermanReingoldLayoutOptions {
  iterations?: number;
  edgeWeightInfluence?: number
};

interface IFruchtermanReingoldLayout {
  (graph: Graph, options?: FruchtermanReingoldLayoutOptions): LayoutMapping;
  assign(graph: Graph, options?: FruchtermanReingoldLayoutOptions): void;
}

function genericFruchtermanReingoldLayout(
  assign: false,
  graph: Graph,
  options?: FruchtermanReingoldLayoutOptions
): LayoutMapping;
function genericFruchtermanReingoldLayout(
  assign: true,
  graph: Graph,
  options?: FruchtermanReingoldLayoutOptions
): void;
function genericFruchtermanReingoldLayout(
  assign: boolean,
  graph: Graph,
  options?: FruchtermanReingoldLayoutOptions
): void | LayoutMapping {
  if (!isGraph(graph)) {
    throw new Error(
      'graphology-layout-fruchterman-reingold: the given graph is not a valid graphology instance.'
    );
  }

  const iterations = options?.iterations || 10;
  const edgeWeightInfluence = options?.edgeWeightInfluence || 1;

  const nodes = graph.nodes();

  const w = 1.0;
  const l = 1.0;
  const area = w * l;
  const k = Math.sqrt(area / nodes.length);
  
  const calculateAttractiveForce = (d: number) => (d * d) / k;
  const calculateRepulsiveForce = (d: number) => - (k * k) / d;

  const positions = nodes.reduce(
    (prev, nodeKey) => ({
      ...prev,
      [nodeKey]: {
        x: graph.getNodeAttribute(nodeKey, 'x'),
        y: graph.getNodeAttribute(nodeKey, 'y'),
      },
    }),
    {} as LayoutMapping
  );

  let t = w / 10.0;
  const cool = (t: number) => t / (iterations + 1.0); // ? maybe better cooling function eg quenching and simmering

  for (let i = 0; i < iterations; i++) {
    const repulsiveForces = Object.keys(positions).reduce((prev, vKey) => {
      const force = Object.keys(positions).reduce(
        (disp, uKey) => {
          if (vKey !== uKey) {
            const dx = positions[vKey].x - positions[uKey].x;
            const dy = positions[vKey].y - positions[uKey].y;

            const delta = Math.sqrt(dx * dx + dy * dy);

            if (delta !== 0) {
              const ddx = dx / delta;
              const ddy = dy / delta;
              const f = calculateRepulsiveForce(delta) / delta;

              return {
                x: disp.x + ddx * f,
                y: disp.y + ddy * f,
              };
            }
          }
          return disp;
        },
        { x: 0, y: 0 }
      );
      return {
        ...prev,
        [vKey]: force,
      };
    }, {} as LayoutMapping);

    const attractiveForces = graph.edges().reduce((prev, edgeKey) => {
      const vKey = graph.source(edgeKey);
      const uKey = graph.target(edgeKey);
      const weight: number = graph.getEdgeAttribute(edgeKey, 'weight') || 1;

      const dx = positions[vKey].x - positions[uKey].x;
      const dy = positions[vKey].y - positions[uKey].y;
      const delta = Math.sqrt(dx * dx + dy * dy);

      if (delta !== 0) {
        const ddx = dx / delta;
        const ddy = dy / delta;
        const f = calculateAttractiveForce(delta) * Math.pow(weight, edgeWeightInfluence);

        return {
          ...prev,
          [vKey]: {
            x: prev[vKey].x - ddx * f,
            y: prev[vKey].y - ddy * f,
          },
          [uKey]: {
            x: prev[uKey].x + ddx * f,
            y: prev[uKey].y + ddy * f,
          },
        };
      }
      return prev;
    }, repulsiveForces);

    Object.keys(positions).forEach((vKey) => {
      const dx = attractiveForces[vKey].x;
      const dy = attractiveForces[vKey].y;

      const disp = Math.sqrt(dx * dx + dy * dy);

      if (disp !== 0) {
        const x = positions[vKey].x + (dx / disp) * Math.min(dx, t);
        const y = positions[vKey].y + (dy / disp) * Math.min(dy, t);

        positions[vKey] = {
          x: Math.min(w / 2, Math.max(-w / 2, x)),
          y: Math.min(l / 2, Math.max(-l / 2, y)),
        };
      }
    });

    t = cool(t);
  }

  if (assign) {
    graph.updateEachNodeAttributes((nodeKey, attr) => positions[nodeKey]);
    return;
  }
  return positions;
}

const fruchtermanReingoldLayout: IFruchtermanReingoldLayout = (
  graph: Graph,
  options?: FruchtermanReingoldLayoutOptions
) => genericFruchtermanReingoldLayout(false, graph, options);
fruchtermanReingoldLayout.assign = (
  graph: Graph,
  options?: FruchtermanReingoldLayoutOptions
) => genericFruchtermanReingoldLayout(true, graph, options);

export default fruchtermanReingoldLayout;
