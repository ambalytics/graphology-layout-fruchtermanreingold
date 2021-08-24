import Graph from 'graphology-types';
import { isGraph } from 'graphology-utils';
import { fruchtermanReingoldImpl } from './fruchterman-reingold';
import {
  FruchtermanReingoldLayoutOptions,
  LayoutMapping,
  parseOptions,
  parseGraph,
} from './utils';

interface IFruchtermanReingoldLayout {
  (
    graph: Graph,
    options?: Partial<FruchtermanReingoldLayoutOptions>
  ): LayoutMapping;
  assign(
    graph: Graph,
    options?: Partial<FruchtermanReingoldLayoutOptions>
  ): void;
}

function genericFruchtermanReingoldLayout(
  assign: false,
  graph: Graph,
  options?: Partial<FruchtermanReingoldLayoutOptions>
): LayoutMapping;
function genericFruchtermanReingoldLayout(
  assign: true,
  graph: Graph,
  options?: Partial<FruchtermanReingoldLayoutOptions>
): void;
function genericFruchtermanReingoldLayout(
  assign: boolean,
  graph: Graph,
  options?: Partial<FruchtermanReingoldLayoutOptions>
): void | LayoutMapping {
  if (!isGraph(graph)) {
    throw new Error(
      'graphology-layout-fruchterman-reingold: the given graph is not a valid graphology instance.'
    );
  }

  const parsedOptions = parseOptions(options || {});
  const [nodes, edges] = parseGraph(graph);

  const updateCb = assign
    ? (layout: LayoutMapping) => {
        graph.updateEachNodeAttributes(
          (nodeKey, attr) => ({
            ...attr,
            ...layout[nodeKey],
          }),
          { attributes: ['x', 'y'] }
        );
      }
    : undefined;

  const positions = fruchtermanReingoldImpl(
    nodes,
    edges,
    parsedOptions,
    updateCb
  );

  if (!assign) return positions;
}

const fruchtermanReingoldLayout: IFruchtermanReingoldLayout = (
  graph: Graph,
  options?: Partial<FruchtermanReingoldLayoutOptions>
) => genericFruchtermanReingoldLayout(false, graph, options);
fruchtermanReingoldLayout.assign = (
  graph: Graph,
  options?: Partial<FruchtermanReingoldLayoutOptions>
) => genericFruchtermanReingoldLayout(true, graph, options);

export default fruchtermanReingoldLayout;
export { FruchtermanReingoldLayoutOptions } from './utils';
