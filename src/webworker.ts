import {
  EdgeMapping,
  FruchtermanReingoldLayoutOptions,
  LayoutMapping,
} from './utils';
import { fruchtermanReingoldImpl as origImpl } from './fruchterman-reingold';
import './fruchterman-reingold';

// *-------------------------------------------------------------------------------------
// *                  MODELS/INTERFACES TO USE IN CLIENT AND WORKER
// *

export enum WorkerAction {
  DATA = 'DATA',
}

export interface ClientDataMessage {
  action: WorkerAction.DATA;
  data: {
    nodes: string[];
    edges: EdgeMapping;
    options: FruchtermanReingoldLayoutOptions;
  };
}

export type ClientMessage = ClientDataMessage;

export enum MessageType {
  ERROR = 'ERROR',
  DATA = 'DATA',
  RUNNING = 'RUNNING',
  FINISHED = 'FINISHED',
}

export interface WorkerErrorMessage {
  type: MessageType.ERROR;
  data: string;
}

export interface WorkerDataMessage {
  type: MessageType.DATA;
  data: {
    positions: LayoutMapping;
    i: number;
  };
}

export interface WorkerRunningMessage {
  type: MessageType.RUNNING;
}

export interface WorkerFinishedMessage {
  type: MessageType.FINISHED;
  data: LayoutMapping;
}

export type WorkerMessage =
  | WorkerErrorMessage
  | WorkerDataMessage
  | WorkerRunningMessage
  | WorkerFinishedMessage;

// *                                    END
// *-------------------------------------------------------------------------------------

// *-------------------------------------------------------------------------------------
// *                            WORKER IMPLEMENTATION
// *

export function workerFn(): void {
  // fruchtermanReingoldImpl and will be inserted here on runtime (as webworker cannot load it)
  const fruchtermanReingoldImpl = origImpl; // <%= fruchtermanReingoldImpl %>

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx: Worker = self as any;

  ctx.addEventListener('message', (event: MessageEvent<ClientMessage>) => {
    if (event.data.action === 'DATA') {
      ctx.postMessage({
        type: 'RUNNING',
      } as WorkerMessage);

      const { nodes, edges, options } = event.data.data;

      const positions = fruchtermanReingoldImpl(
        nodes,
        edges,
        options,
        (layout, i) =>
          ctx.postMessage({
            type: 'DATA',
            data: {
              positions: layout,
              i,
            },
          } as WorkerMessage)
      );

      ctx.postMessage({
        type: 'FINISHED',
        data: positions,
      } as WorkerMessage);

      ctx.terminate();
    }
  });
}
// *                                    END
// *-------------------------------------------------------------------------------------
