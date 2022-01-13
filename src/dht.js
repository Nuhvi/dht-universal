import DHTNode from '@hyperswarm/dht';
// import { DHT as DHTRelayed } from './dht.browser.js';

/** @type {_DHT} */
export class DHT extends DHTNode {
  /** @param {DHTOpts} opts */
  constructor(opts) {
    // if (opts?.relays) {
    // return DHTRelayed.create(opts);
    // } else {
    super(opts);
    // }
  }
}

/**
 * @typedef {import('./interfaces').DHT} _DHT
 * @typedef {import('./interfaces').DHTOpts} DHTOpts
 */
