import Graph from 'graphology-types';
import { isGraph } from 'graphology-utils';
import { fruchtermanReingoldImpl } from './fruchterman-reingold';
import {
  FruchtermanReingoldLayoutOptions,
  LayoutMapping,
  parseOptions,
  parseGraph,
} from './utils';
import {
  ClientMessage,
  MessageType,
  WorkerAction,
  workerFn,
  WorkerMessage,
} from './webworker';

export { FruchtermanReingoldLayoutOptions } from './utils';

interface IFruchtermanReingoldLayout {
  (
    graph: Graph,
    options?: Partial<FruchtermanReingoldLayoutOptions>
  ): Promise<LayoutMapping>;
  assign(
    graph: Graph,
    options?: Partial<FruchtermanReingoldLayoutOptions>
  ): Promise<LayoutMapping>;
}

function genericFruchtermanReingoldLayout(
  assign: boolean,
  graph: Graph,
  options?: Partial<FruchtermanReingoldLayoutOptions>
): Promise<LayoutMapping> {
  return new Promise<LayoutMapping>((resolve) => {
    if (!isGraph(graph)) {
      throw new Error(
        'graphology-layout-fruchterman-reingold: the given graph is not a valid graphology instance.'
      );
    }

    const parsedOptions = parseOptions(options || {});
    const [EdgeMatrix, order, parseLayout] = parseGraph(
      graph,
      parsedOptions.weightAttribute
    );
    const xURL = window.URL || window.webkitURL;

    // Get code for worker and insert fruchtermanReingoldImpl
    const code = workerFn
      .toString()
      .replace(
        /[^\n]*\/\/\s*<%= fruchtermanReingoldImpl %>/,
        fruchtermanReingoldImpl.toString()
      );
    const objectUrl = xURL.createObjectURL(
      new Blob(['(' + code + ').call(this);'], { type: 'text/javascript' })
    );
    const worker = new Worker(objectUrl);
    xURL.revokeObjectURL(objectUrl);

    worker.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
      switch (event.data.type) {
        case MessageType.DATA: {
          if (assign) {
            const positions = event.data.data.positions;
            graph.updateEachNodeAttributes(
              (nodeKey, attr) => ({
                ...attr,
                ...parseLayout(new Float32Array(positions))[nodeKey],
              }),
              { attributes: ['x', 'y'] }
            );
          }
          break;
        }
        case MessageType.FINISHED: {
          const positions = event.data.data;
          resolve(parseLayout(new Float32Array(positions)));
          worker.terminate();
          break;
        }
      }
    });

    worker.postMessage(
      {
        action: WorkerAction.DATA,
        data: {
          order,
          EdgeMatrix: EdgeMatrix.buffer,
          options: parsedOptions,
        },
      } as ClientMessage,
      [EdgeMatrix.buffer]
    );
  });
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
