# dht-universal

Universal wrapper for @hyperswarm/dht and @hyperswarm/dht-relay working in Node.js and the Browser

## Installation

```sh
npm install dht-universal
```

## Usage

```js
import { DHT } from 'dht-universal/dht'; // mind the /dht after the package name

const node = await DHT();

const anotherNode = await DHT();
const noiseSocket = anotherNode.connect(node2.defaultKeyPair.publicKey);
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
  - [x] `node.connect() without options`
  - [x] `encryptedConnection.on('open')`
  - [x] `encryptedConnection.remotePublicKey`
  - [x] `encryptedConnection.publicKey`
  - [x] `encryptedConnection.end()`

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
