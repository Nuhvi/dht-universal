import DHTNode from '@hyperswarm/dht'
import { DHT as DHTRelayed } from './dht.browser.js'

/** @type {DHTModule} */
export const DHT = {
  keyPair: DHTNode.keyPair,
  create: async (opts) =>
    // @ts-ignore
    opts?.relays ? DHTRelayed.create(opts) : new DHTNode(opts)
}

/**
 * @typedef {import('./interfaces').DHTModule } DHTModule
 * @typedef {import('./interfaces').DHT} DHT
 */
