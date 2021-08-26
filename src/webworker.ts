import { FruchtermanReingoldLayoutOptions } from './utils';
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
    order: number;
    assign: boolean;
    EdgeMatrix: ArrayBuffer;
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
    positions: ArrayBuffer;
    i: number;
  };
}

export interface WorkerRunningMessage {
  type: MessageType.RUNNING;
}

export interface WorkerFinishedMessage {
  type: MessageType.FINISHED;
  data: ArrayBuffer;
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
  // fruchtermanReingoldImpl and will be inserted here on build (as webworker cannot load it)
  const fruchtermanReingoldImpl = origImpl; // <%= fruchtermanReingoldImpl %>

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx: Worker = self as any;

  ctx.addEventListener('message', (event: MessageEvent<ClientMessage>) => {
    if (event.data.action === 'DATA') {
      ctx.postMessage({
        type: 'RUNNING',
      } as WorkerMessage);

      const { order, assign, EdgeMatrix, options } = event.data.data;

      const updateCb = assign
        ? (layout: Float32Array, i: number) => {
            // posting an transferable object (FLoar32Array.buffer) will transfer the ownership...
            // the object is unusable for the worker afterwards... As the algorithm has to use the array again we have to send a copy
            const positions = layout.slice();
            ctx.postMessage(
              {
                type: 'DATA',
                data: {
                  positions: positions.buffer,
                  i,
                },
              } as WorkerMessage,
              [positions.buffer]
            );
          }
        : undefined;

      const positions = fruchtermanReingoldImpl(
        order,
        new Float32Array(EdgeMatrix),
        options,
        updateCb
      );

      ctx.postMessage(
        {
          type: 'FINISHED',
          data: positions.buffer,
        } as WorkerMessage,
        [positions.buffer]
      );

      ctx.terminate();
    }
  });
}
// *                                    END
// *-------------------------------------------------------------------------------------
