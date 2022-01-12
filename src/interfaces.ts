import type { Duplex, EventEmitter, Readable } from 'stream';

export interface KeyPair {
  readonly publicKey: Uint8Array;
  readonly secretKey: Uint8Array;
}

export interface SecretStream extends Duplex {
  readonly publicKey: Uint8Array;
  readonly remotePublicKey: Uint8Array;
  readonly handshakeHash: Uint8Array;

  on: /** Yep client connections emit open. Part of the streamx state machine https://github.com/hyperswarm/dht/issues/69#issuecomment-1009691870 */
  ((event: 'open', listener: () => void) => this) &
    /** They also emit “connect” as nodejs tcp compat https://github.com/hyperswarm/dht/issues/69#issuecomment-1009692257 */
    ((event: 'connect', listener: () => void) => this) &
    /** From Stream, please open an issue if you know a better way to inherit this. */
    ((event: 'close', listener: () => void) => this) &
    ((event: 'data', listener: (chunk: any) => void) => this) &
    ((event: 'end', listener: () => void) => this) &
    ((event: 'error', listener: (err: Error) => void) => this) &
    ((event: 'pause', listener: () => void) => this) &
    ((event: 'readable', listener: () => void) => this) &
    ((event: 'resume', listener: () => void) => this) &
    ((event: string | symbol, listener: (...args: any[]) => void) => this);
}

export interface Server extends EventEmitter {
  constructor: (dht: DHT, opts: any) => Server;
  listen: (keyPair?: KeyPair) => Promise<void>;
  address: () => {
    host: string;
    port: number;
    publicKey: Uint8Array;
  };
  publicKey: Uint8Array;
  close: () => Promise<void>;
  closed: boolean;
  on: ((
    event: 'connection',
    listener: (encryptedSocket: SecretStream) => void,
  ) => this) &
    ((event: 'listening', listener: () => void) => this) &
    ((event: 'close', listener: () => void) => this) &
    ((event: string | symbol, listener: (...args: any[]) => void) => this);
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
  onconnection?: (encryptedSocket: SecretStream) => void;
  firewall?: (
    remotePublicKey: Uint8Array,
    remoteHandshakePayload: HandshakePayload,
  ) => boolean | Promise<boolean>;
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
  destroyed: boolean;
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
  keyPair?: KeyPair;
  relays?: string[];
}

export interface DHTModule {
  keyPair: (seed?: Uint8Array) => KeyPair;
  create: (opts?: DHTOpts) => Promise<DHT>;
}
