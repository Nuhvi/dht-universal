# dht-universal

Universal wrapper for @hyperswarm/dht and @hyperswarm/dht-relay working in Node.js and the Browser

## Usage

```js
import { DHT } from 'dht-universal';

const node = await DHT();

const anotherNode = await DHT();
const noiseSocket = anotherNode.connect(node2.defaultKeyPair.publicKey);
```
