import { Node } from './dht-relay/index.js';
import ws from './dht-relay/ws.js';
import WebSocket from 'isomorphic-ws';

const DEFAULT_RELAYS = ['wss://dht-relay.synonym.to/'];

/**
 * @param {import ('isomorphic-ws')} wsServer
 */
const tryWS = async (wsServer) =>
  new Promise((resolve) => {
    wsServer.onerror = (/** @type {*} */ error) => resolve(!error);
    wsServer.onopen = () => resolve(wsServer);
  });

/** @type {DHT} */
export class DHT extends Node {
  /** @param {DHTOpts} opts */
  constructor(opts) {
    if (!opts?.relays) {
      const websocket = new WebSocket(DEFAULT_RELAYS[0]);
      super(new ws.Socket(websocket), null, opts);
    }
    // @ts-ignore
    this.opts = opts;
  }
  async readyyo(opts) {
    const relays = opts?.relays || [...DEFAULT_RELAYS];

    let wsServer, relay;
    while (!wsServer && (relay = relays.shift())) {
      wsServer = await tryWS(new WebSocket(relay));
    }

    if (!wsServer) {
      throw new Error('Could not connect to any of the DHT relays');
    }

    return Node.fromTransport(ws, wsServer, opts);
  }
}

/**
 * @typedef {import('./interfaces').DHT} _DHT
 * @typedef {import('./interfaces').DHTOpts} DHTOpts
 */
