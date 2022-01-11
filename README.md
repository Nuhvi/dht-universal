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

Same as the instance methods and readonly variables of the [@hyperswarm/dht](https://github.com/hyperswarm/dht#api).
