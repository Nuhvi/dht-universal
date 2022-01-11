import type { Duplex, EventEmitter, Readable } from 'stream';

export interface KeyPair {
  readonly publicKey: Uint8Array;
  readonly secretKey: Uint8Array;
}

export interface SecretStream extends Duplex {
  readonly publicKey: Uint8Array;
  readonly remotePublicKey: Uint8Array;
  readonly handshakeHash: Uint8Array;
}

export interface Server extends EventEmitter {
  constructor: (dht: DHT, opts: any) => Server;
  listen: () => Promise<void>;
  address: () => {
    host: string;
    port: number;
    publicKey: Uint8Array;
  };
  close: () => Promise<void>;
  on:
    | ((
        event: 'connection',
        cb: (encryptedSocket: SecretStream) => void,
      ) => this)
    | ((event: 'close', cb: () => void) => this);
}

export interface HandshakePayload {
  isInitiator: boolean;
  publicKey: Uint8Array;
  remotePublicKey: Uint8Array;
  remoteId: Uint8Array;
  hash: Uint8Array;
  rx: Uint8Array;
  tx: Uint8Array;
}

export interface ServerOpts {
  onconnection?: Server['on'];
  firewall: (
    remotePublicKey: Uint8Array,
    remoteHandshakePayload: HandshakePayload,
  ) => Promise<boolean>;
}

export interface DHTNode {
  host: string;
  port: number;
}

export interface Query extends Readable {
  readonly from: DHTNode & { id: Uint8Array };
  readonly to: DHTNode;
  readonly peers: [{ publickey: Uint8Array; nodes: DHTNode[] }];
}

export interface DHT {
  /**
   * Fully destroy this DHT node and unannounce any running servers.
   *
   * @param {object} [opts]
   * @param {boolean} [opts.force] - force close the node without waiting for the servers to unannounce.
   */
  destroy: (opts?: { force?: boolean }) => Promise<void>;
  /**
   * Create a new server for accepting incoming encrypted P2P connections.
   */
  createServer: (
    options?: ServerOpts | ((encryptedSocket: SecretStream) => void),
    onconnection?: (encryptedSocket: SecretStream) => void,
  ) => Server;
  /**
   * @param {Uint8Array} remotePublicKey
   * @param {object} [options]
   * @param {DHTNode[]} [options.nodes] - optional array of close dht nodes to speed up connecting
   * @param {object} [options.keyPair] - optional key pair to use when connection (defaults to node.defaultKeyPair)
   */
  connect: (
    remotePublicKey: Uint8Array,
    options?: { nodes: []; keyPair: KeyPair },
  ) => SecretStream;
  // TODO: add type for options.socket
  /**
   * Look for peers in the DHT on the given topic. Topic should be a 32 byte buffer (normally a hash of something).
   *
   * @private
   */
  lookup: (
    topic: Uint8Array,
    options?: { retry: boolean; socket: any },
  ) => Query;
  defaultKeyPair: KeyPair;
}

export interface DHTOpts {
  relays?: string[];
}
