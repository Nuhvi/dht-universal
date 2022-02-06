// @ts-ignore
import _DHT from '@hyperswarm/dht'

export class DHT extends _DHT {
  /**
   * @param {DHTOpts & {relays?: string[]}} opts
   * @returns {_DHT}
   */
  static async create (opts) {
    const node = new _DHT(opts)
    // @ts-ignore
    await node.ready()
    return node
  }
}

/**
 * @typedef {import('./interfaces').DHTOpts} DHTOpts
 * @typedef {import('./interfaces').DHT} _DHT
 */
