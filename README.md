# dht-universal

Universal wrapper for `@hyperswarm/dht` and `@hyperswarm/dht-relay` working in Node.js and the Browser

## Installation

```sh
npm install dht-universal
```

## Usage

In browser, it will use the `@hyperswarm/dht-relay` with a `WebSocket` transport, so you need to pass a relay URL to the constructor, and wait for it to be ready to confirm the websocket is open.

### Custom relays

```js
import { DHT } from 'dht-universal';

const node = new DHT({ relay: 'wss://dht-relay.example.com/' });

await node.ready();
```

## API

Should be the same as [@hyperswarm/dht](https://github.com/hyperswarm/dht#api).

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
  - [ ] `node.defaultKeyPair`
  - [x] `node.createServer()`
  - [ ] `node.createServer() with firewall`
  - [ ] `node.destroy([opts])`
  - [ ] `server.publicKey`
  - [x] `server.address()`
  - [x] `server.listen()`
  - [ ] `server.close()`
  - [x] `server.on('listening')`
  - [ ] `server.on('connection')`
  - [x] `server.on('close')`
  - [x] `node.connect() without options`
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
