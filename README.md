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

Node

- [x] Instantiation
- [x] `DHT.keyPair([seed])`
- [x] `node.destroy([opts])`

Browser

- [ ] Instantiation
- [ ] `DHT.keyPair([seed])`
- [ ] `node.destroy([opts])`
