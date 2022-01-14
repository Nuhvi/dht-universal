# dht-universal

Universal wrapper for `@hyperswarm/dht` and `@hyperswarm/dht-relay` working in Node.js and the Browser

## Installation

```sh
npm install dht-universal
```

## Usage

```js
import { DHT } from 'dht-universal';

const node = new DHT();

const anotherNode = new DHT();
const noiseSocket = anotherNode.connect(node2.defaultKeyPair.publicKey);

// And use static methods
DHT.keyPair(seed);
```

### Browser

In browser, it will use the `@hyperswarm/dht-relay` with a `WebSocket` transport, and a default set of relays

### Custom relays

```js
import { DHT } from 'dht-universal';

const node = new DHT({
  relay: 'wss://dht-relay1.example.com/',
});
```

## API

Should be thse same as [@hyperswarm/dht](https://github.com/hyperswarm/dht#api).

### Covered by tests and type definitions:

- Tested in normal DHT

  - [x] `DHT.keyPair([seed])`
  - [x] Instantiation
  - [x] `node.defaultKeyPair`
  - [x] `node.destroyed`
  - [x] `node.ready()`
  - [x] `node.createServer()`
  - [x] `node.createServer() with firewall`
  - [x] `node.destroy([opts])`
  - [x] `server.publicKey`
  - [x] `server.address()`
  - [x] `server.listen()`
  - [x] `server.close()`
  - [x] `server.on('listening')`
  - [x] `server.on('connection')`
  - [x] `server.on('close')`
  - [x] `node.connect({keyPair}) without optional nodes`
  - [x] `encryptedConnection.on('open')`
  - [x] `encryptedConnection.remotePublicKey`
  - [x] `encryptedConnection.publicKey`
  - [x] `node.lookup(topic) without options`
  - [x] `node.announce(topic,keyPair) without relayAddresses or options`
  - [ ] `node.unannounce`
  - [ ] `node.immutablePut(value)`
  - [ ] `node.immutableGet(value)`
  - [ ] `node.mutablePut(value)`
  - [ ] `node.mutableGet(value)`

- Passing in Relay

  - [ ] `throw error on invalid relay`
  - [x] `DHT.keyPair([seed])`
  - [x] `DHT.create()`
  - [x] `node.defaultKeyPair`
  - [x] `node.createServer()`
  - [ ] `node.createServer() with firewall`
  - [x] `node.destroy([opts])`
  - [x] `server.publicKey`
  - [x] `server.address()`
  - [x] `server.listen()`
  - [x] `server.close()`
  - [x] `server.on('listening')`
  - [x] `server.on('connection')`
  - [x] `server.on('close')`
  - [x] `node.connect() without options`
  - [x] `encryptedConnection.on('open')`
  - [x] `encryptedConnection.remotePublicKey`
  - [x] `encryptedConnection.publicKey`
  - [ ] `node.lookup(topic) without options`
  - [ ] `node.announce(topic,keyPair) without relayAddresses or options`
  - [ ] `node.unannounce`
  - [ ] `node.immutablePut(value)`
  - [ ] `node.immutableGet(value)`
  - [ ] `node.mutablePut(value)`
  - [ ] `node.mutableGet(value)`
