import Graph from 'graphology-types';
import { isGraph } from 'graphology-utils';

type LayoutMapping = { [key: string]: { x: number; y: number } };

export interface FruchtermanReingoldSettings {
  // TODO Any needed setting
}

export type FruchtermanReingoldLayoutOptions = {
  // TODO fruchterman reingold options
  iterations: number;
  settings?: FruchtermanReingoldSettings;
};

interface IFruchtermanReingoldLayout {
  (graph: Graph, options?: FruchtermanReingoldLayoutOptions): LayoutMapping;
  assign(graph: Graph, options?: FruchtermanReingoldLayoutOptions): void;
}

function genericFruchtermanReingoldLayout(
  assign: false,
  graph: Graph,
  options?: FruchtermanReingoldLayoutOptions
): LayoutMapping
function genericFruchtermanReingoldLayout(
  assign: true,
  graph: Graph,
  options?: FruchtermanReingoldLayoutOptions
): void
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

  const nodes = graph.nodes();

  const W = 1,
    L = 1; // { W and L are the width and length of the frame }
  const A = W * L;
  const k = Math.sqrt(A / nodes.length);
  let t = 1; // TODO better value??
  const cool = (t: number) => t - 0.1; // TODO better cooling function

  const attractiveForce = (x: number) => Math.pow(x, 2) / k;
  const repulsiveForce = (z: number) => Math.pow(k, 2) / z;

  let positions = nodes.reduce((prev, nodeKey) => ({
    ...prev,
    [nodeKey]: {
      x: graph.getNodeAttribute(nodeKey, 'x'),
      y: graph.getNodeAttribute(nodeKey, 'y'),
    },
  }), {} as LayoutMapping );

  for (let i = 0; i < iterations; i++) {
    // { calculate repulsive forces}
    const repulsiveForces = Object.entries(positions).reduce((prev, [vKey, vPos]) => {
      const force = Object.entries(positions).reduce(
        (disp, [uKey, uPos]) => {
          if ( vKey === uKey ) {
            return disp;
          }
          
          const diff = { x: vPos.x - uPos.x, y: vPos.y - uPos.y };
          const diffLength = Math.sqrt(
            Math.pow(diff.x, 2) + Math.pow(diff.y, 2)
          );

          return {
            x: disp.x + (diff.x / diffLength) * repulsiveForce(diffLength),
            y: disp.y + (diff.y / diffLength) * repulsiveForce(diffLength),
          };
        },
        { x: 0, y: 0 }
      );

      return {
        ...prev,
        [vKey]: force,
      };
    }, {} as LayoutMapping);

    // { calculate attractive forces }
    const attractiveForces = graph.edges().reduce((prev, edgeKey) => {
      const v = graph.source(edgeKey);
      const u = graph.target(edgeKey);

      const vPos = positions[v];
      const uPos = positions[u];

      const diff = { x: vPos.x - uPos.x, y: vPos.y - vPos.y };
      const diffLength = Math.sqrt(Math.pow(diff.x, 2) + Math.pow(diff.y, 2));

      const vDisp = {
        x: prev[v].x - (diff.x / diffLength) * attractiveForce(diffLength),
        y: prev[v].y - (diff.y / diffLength) * attractiveForce(diffLength),
      };

      const uDisp = {
        x: prev[u].x + (diff.x / diffLength) * attractiveForce(diffLength),
        y: prev[u].y + (diff.y / diffLength) * attractiveForce(diffLength),
      };

      return {
        ...prev,
        [v]: vDisp,
        [u]: uDisp,
      };
    }, repulsiveForces);

    // { limit the maximum displacement to the temperature t }
    // { and then prevent from being displaced outside frame}
    positions = Object.entries(positions).reduce((prev, [vKey, prevPos]) => {
      const force = attractiveForces[vKey];
      const forceLength = Math.sqrt(
        Math.pow(force.x, 2) + Math.pow(force.y, 2)
      );

      const pos = {
        x: prevPos.x + (force.x / forceLength) * Math.min(force.x, t),
        y: prevPos.y + (force.y / forceLength) * Math.min(force.y, t),
      };
      pos.x = Math.min(W / 2.0, Math.max(-W / 2.0, pos.x));
      pos.y = Math.min(L / 2.0, Math.max(-L / 2.0, pos.y));

      return {
        ...prev,
        [vKey]: pos,
      };
    }, {} as LayoutMapping);

    t = cool(t);
  }

  if (assign) {
    graph.updateEachNodeAttributes((nodeKey, attr) => positions[nodeKey]);
    return;
  }
  return positions;
}

const fruchtermanReingoldLayout: IFruchtermanReingoldLayout = (graph: Graph, options?: FruchtermanReingoldLayoutOptions) => genericFruchtermanReingoldLayout(false, graph, options);
fruchtermanReingoldLayout.assign = (graph: Graph, options?: FruchtermanReingoldLayoutOptions) => genericFruchtermanReingoldLayout(true, graph, options);

export default fruchtermanReingoldLayout;
