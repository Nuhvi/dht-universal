// @ts-ignore
import _DHT from '@hyperswarm/dht-relay'
// @ts-ignore
import Stream from '@hyperswarm/dht-relay/ws'
import WebSocket from 'isomorphic-ws'

export class DHT extends _DHT {
  /**
   * @param {DHTOpts & {socket: Socket}} opts
   */
  constructor (opts) {
    super(new Stream(true, opts.socket), opts)
  }

  /**
   * @param {DHTOpts & {relays?: string[]}} opts
   */
  static async create (opts) {
    if (!opts.relays || opts.relays.length === 0) {
      throw new Error('DHT relays must be provided in browser environment')
    }

    let socket
    for (const relay of opts.relays) {
      socket = await tryWS(relay)
    }

    if (!socket) { throw new Error('Could not connect to any of the provided relays') }

    return new DHT({ ...opts, socket })
  }
}

/**
 * @param {string} relay
 * @returns {Promise<Socket | null>}
 */
function tryWS (relay) {
  const ws = new WebSocket(relay)
  return new Promise((resolve, reject) => {
    ws.onopen = () => resolve(ws)
    ws.onerror = () => {
      resolve(null)
    }
  })
}

/**
 * @typedef {import('./interfaces').DHT} _DHT
 * @typedef {import('./interfaces').DHTOpts} DHTOpts
 * @typedef {import('ws')} Socket
 */
