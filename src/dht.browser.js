// @ts-ignore
import { Node } from '@hyperswarm/dht-relay'
// @ts-ignore
import ws from '@hyperswarm/dht-relay/ws'
import WebSocket from 'isomorphic-ws'

// @ts-ignore
export class DHT extends Node {
  /** @param {DHTOpts} opts */
  constructor (opts) {
    const websocket = new WebSocket(opts?.relay)

    super(new ws.Socket(websocket), null, opts)
  }
}

/**
 * @typedef {import('./interfaces').DHT} _DHT
 * @typedef {import('./interfaces').DHTOpts} DHTOpts
 */

/**
 * @typedef {import('isomorphic-ws')} WebSocket
 */
