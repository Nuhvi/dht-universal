import type { Duplex, EventEmitter } from 'stream'

export interface KeyPair {
  publicKey: Uint8Array
  secretKey: Uint8Array
}

interface Server extends EventEmitter {
  listen: () => Promise<void>
  address: () => {
    host: string
    port: number
    publicKey: Uint8Array
  }
}

export interface NoiseSocket extends Duplex {
  handshakeHash: Uint8Array
  remotePublicKey: Uint8Array
}
export interface DHT {
  destroy: () => Promise<void>
  createServer: (onconnection?: (noiseSocket: NoiseSocket) => void) => Server
  connect: (key: Uint8Array) => NoiseSocket
  defaultKeyPair: KeyPair
}

export interface DHTOpts {
  relays?: string[]
}
