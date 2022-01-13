declare module '@hyperswarm/dht' {
  export = class DHT {
    constructor(...args);
    static keyPair(): { publicKey: Uint8Array; secretKey: Uint8Array };
  };
}
