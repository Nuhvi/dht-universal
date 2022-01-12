# dht-universal

Universal wrapper for `@hyperswarm/dht` and `@hyperswarm/dht-relay` working in Node.js and the Browser

## Installation

```sh
npm install dht-universal
```

## Usage

```js
import { DHT } from 'dht-universal/dht'; // mind the /dht after the package name

const node = await DHTcreate();

const anotherNode = await DHT();
const noiseSocket = anotherNode.connect(node2.defaultKeyPair.publicKey);
```

### Browser

In browser, it will use the `@hyperswarm/dht-relay` with a `WebSocket` transport, and a default set of relays

### Custom relays

You can also pass a custom set of relays to the `DHT.create()` function.

```js
import { DHT } from 'dht-universal/dht'; // mind the /dht after the package name

const node = await DHT.create({
  relays: ['wss://dht-relay1.example.com/', 'wss://dht-relay2.example.com/'],
});
```

## API

Should be thse same as [@hyperswarm/dht](https://github.com/hyperswarm/dht#api).

### Covered by tests and type definitions:

- Tested in normal DHT

  - [x] Instantiation
  - [x] `DHT.keyPair([seed])`
  - [x] `node.defaultKeyPair`
  - [x] `node.createServer()`
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
  - [x] `encryptedConnection.end()`
  - [x] `node.lookup(topic) without options`
  - [x] `node.announce(topic,keyPair) without relayAddresses or options`
  - [ ] `node.unannounce`
  - [ ] `node.immutablePut(value)`
  - [ ] `node.immutableGet(value)`
  - [ ] `node.mutablePut(value)`
  - [ ] `node.mutableGet(value)`

- Passing in Relay

  - [ ] Instantiation
  - [ ] `DHT.keyPair([seed])`
  - [ ] `node.defaultKeyPair`
  - [ ] `node.createServer()`
  - [ ] `node.destroy([opts])`
  - [ ] `server.publicKey`
  - [ ] `server.address()`
  - [ ] `server.listen()`
  - [ ] `server.close()`
  - [ ] `server.on('listening')`
  - [ ] `server.on('connection')`
  - [ ] `server.on('close')`
  - [ ] `node.connect() without options`
  - [ ] `encryptedConnection.on('open')`
  - [ ] `encryptedConnection.remotePublicKey`
  - [ ] `encryptedConnection.publicKey`
  - [ ] `encryptedConnection.end()`
  - [ ] `node.lookup(topic) without options`
  - [ ] `node.announce(topic,keyPair) without relayAddresses or options`
  - [ ] `node.unannounce`
  - [ ] `node.immutablePut(value)`
  - [ ] `node.immutableGet(value)`
  - [ ] `node.mutablePut(value)`
  - [ ] `node.mutableGet(value)`
