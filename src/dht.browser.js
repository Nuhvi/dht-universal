import { Node } from '@hyperswarm/dht-relay'
import ws from '@hyperswarm/dht-relay/ws'
// @ts-ignore
import b4a from 'b4a'
// @ts-ignore
import sodium from 'sodium-universal'

const DEFAULT_RELAYS = ['wss://dht-relay.synonym.to/']

/**
 * @param {import ('isomorphic-ws')} wsServer
 */
const tryWS = async (wsServer) =>
  new Promise((resolve) => {
    wsServer.onerror = (/** @type {*} */ error) => resolve(!error)
    wsServer.onopen = () => resolve(wsServer)
  })

/** @type {DHTModule} */
export const DHT = {
  keyPair: (seed) => {
    const publicKey = b4a.alloc(sodium.crypto_sign_PUBLICKEYBYTES)
    const secretKey = b4a.alloc(sodium.crypto_sign_SECRETKEYBYTES)

    if (seed) sodium.crypto_sign_seed_keypair(publicKey, secretKey, seed)
    else sodium.crypto_sign_keypair(publicKey, secretKey)

    return { publicKey, secretKey }
  },
  create: async (opts) => {
    const relays = opts?.relays || [...DEFAULT_RELAYS]

    const WebSocket = await (await import('isomorphic-ws')).default

    let /** @type {import ('isomorphic-ws')} */ wsServer, relay
    while (!wsServer && (relay = relays.shift())) {
      wsServer = await tryWS(new WebSocket(relay))
    }

    if (!wsServer) {
      throw new Error('Could not connect to any of the DHT relays')
    }

    return Node.fromTransport(ws, wsServer)
  }
}

/**
 * @typedef {import('./interfaces').DHTModule } DHTModule
 * @typedef {import('./interfaces').DHT} DHT
 */
