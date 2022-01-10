import _DHT from '@hyperswarm/dht'
import { DHT as DHTRelayed } from './dht.browser.js'

/**
 * Returns a Hyperswarm DHT
 *
 * @param {DHTOpts} [opts]
 * @returns {Promise<DHT>}
 */
// @ts-ignore
const DHTNode = (opts) => new _DHT(opts)

/**
 * Returns a Hyperswarm DHT
 *
 * @param {DHTOpts} [opts]
 * @returns {Promise<DHT>}
 */
export const DHT = async (opts) =>
  opts?.relays ? DHTRelayed(opts) : DHTNode(opts)

/**
 * @typedef {import('./interfaces').DHT} DHT
 * @typedef {import('./interfaces').DHTOpts} DHTOpts
 */
