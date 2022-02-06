import { expect } from 'aegir/utils/chai.js'
import crypto from 'hypercore-crypto'
import ram from 'random-access-memory'
import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import b4a from 'b4a'

/** @typedef {import ('../src/interfaces').DHT} _DHT */

const INVALID_RELAY_SERVER = 'wss://dht-relay.example.com'

/**
 * @param {_DHT} DHT
 */
export const test = (DHT) => {
  const {
    DHT_NODE_KEY,
    RELAY_URL: VALID_RELAY_SERVER,
    TOPIC: topic,
    CORE_KEY,
    BOOTSTRAP
  } = process.env

  const TOPIC = b4a.from(topic, 'hex')

  const DHT_KEY = b4a.from(DHT_NODE_KEY, 'hex')

  const keyPair = crypto.keyPair(b4a.from('1'.repeat(64), 'hex'))

  const bootstrap = JSON.parse(BOOTSTRAP)

  const nodes = []

  /**
   * @param {import('../src/interfaces').DHTOpts & {relays: string[]}} [opts]
   * @returns {Promise<_DHT>}
   */
  const createNode = async (opts) => {
    const node = await DHT.create({
      relays: [VALID_RELAY_SERVER],
      bootstrap,
      ...opts
    })
    nodes.push(node)
    return node
  }

  const cleanNodes = async () =>
    Promise.all(nodes.map((node) => node.ready().then((_) => node.destroy())))

  describe('Static methods', () => {
    describe('DHT.keyPair', () => {
      it('should create a keyPair without a seed', () => {
        const keyPair = DHT.keyPair()
        expect(Object.keys(keyPair)).to.eql(['publicKey', 'secretKey'])
      })

      it('should create a keyPair from a seed', () => {
        const _keyPair = DHT.keyPair(b4a.from('1'.repeat(64), 'hex'))
        expect(_keyPair).to.eql(keyPair)
      })
    })
  })

  describe('API', () => {
    after(cleanNodes)

    describe('Instantiation', () => {
      it('should accept a defaultKeyPair', async () => {
        const node = await createNode({ keyPair })
        expect(node.defaultKeyPair.publicKey).to.eql(keyPair.publicKey)
      })
    })

    describe.skip('node.destroy()', () => {
      it('should destroy node and close servers', async () => {
        const node = await createNode()
        await node.ready()
        const server = node.createServer()
        await server.listen()

        expect(server.closed).to.be.false('server should not be closed')
        expect(node.destroyed).to.be.false('node should not be destroyed')

        await node.destroy()

        expect(server.closed).to.be.true('server should be closed')
        expect(node.destroyed).to.be.true('node should be destroyed')
      })

      it('should force destroy node and skip close servers', async () => {
        const node = await createNode()
        await node.ready()
        const server = node.createServer()
        await server.listen()

        expect(server.closed).to.be.false('server should not be closed')
        expect(node.destroyed).to.be.false('node should not be destroyed')

        await node.destroy({ force: true })

        expect(server.closed).to.be.false('server should not be closed')
        expect(node.destroyed).to.be.true('node should be destroyed')

        server.close()
      })
    })
  })

  describe('Creating P2P servers', () => {
    after(cleanNodes)

    describe('node.createServer', () => {
      it('should create a server and accept an onconnection callback', async () => {
        const node1 = await createNode()

        const server = node1.createServer((secretStream) => {
          // eslint-disable-next-line
          secretStream.on('data', (data) =>
            expect(data).to.eql(b4a.from('hello'))
          )
        })

        await server.listen()

        const node2 = await createNode()
        const secretStream = node2.connect(server.publicKey)

        expect(
          await new Promise((resolve, reject) => {
            secretStream.on('error', (error) => reject(error))
            secretStream.on('open', () => {
              secretStream.write('hello')
              resolve(true)
            })
          })
        ).to.be.true()
      })

      it('should create a server and accept a firewall function', async () => {
        const node1 = await createNode()
        const node2 = await createNode()

        const server = node1.createServer({
          firewall: (remotePublicKey, remoteHandshakePayload) => {
            expect(remotePublicKey).to.eql(node2.defaultKeyPair.publicKey)
            expect(remoteHandshakePayload).to.eql({
              version: 1,
              error: 0,
              firewall: 0,
              protocols: 3,
              holepunch: null,
              addresses: []
            })

            return true
          },
          onconnection: (secretStream) =>
            expect(true).to.be.false('should not connect')
        })

        await server.listen()

        const secretStream = node2.connect(server.publicKey)

        expect(
          await new Promise((resolve, reject) => {
            secretStream.on('error', (error) => {
              resolve(error.message)
            })
            secretStream.on('open', () => resolve(false))
          })
        ).to.equal('Could not connect to peer')
      })
    })

    describe.skip('server.close()', () => {
      it('should close the server and keep the node running', async () => {
        const node = await createNode({ keyPair })
        const server = node.createServer()
        await server.listen()

        expect(server.closed).to.be.false()
        expect(node.destroyed).to.be.false()

        await server.close()

        expect(server.closed).to.be.true()
        expect(node.destroyed).to.be.false()

        await node.destroy()
        expect(node.destroyed).to.be.true()
      })
    })

    describe('server.listen()', () => {
      it('should listen on the same keyPair as node.defaultKeypair', async () => {
        const node1 = await createNode()

        const server = node1.createServer((secretStream) => {
          secretStream.on('data', (data) =>
            expect(data).to.eql(b4a.from('hello'))
          )
        })

        await server.listen()

        expect(server.publicKey).to.eql(node1.defaultKeyPair.publicKey)

        const node2 = await createNode()
        const secretStream = node2.connect(server.publicKey)
        expect(
          await new Promise((resolve, reject) => {
            secretStream.on('error', (error) => reject(error))
            secretStream.on('open', () => {
              secretStream.write('hello')
              resolve(true)
            })
          })
        ).to.be.true()
      })

      it('should listen on another keyPair than the node.defaultKeypair', async () => {
        const node1 = await createNode({ keyPair })

        const server = node1.createServer((secretStream) => {
          secretStream.on('data', (data) =>
            expect(data).to.eql(b4a.from('hello'))
          )
        })

        const customKeyPair = crypto.keyPair(b4a.from('f'.repeat(64), 'hex'))

        await server.listen(customKeyPair)

        expect(server.publicKey).to.eql(customKeyPair.publicKey)
        expect(server.publicKey).to.not.eql(node1.defaultKeyPair.publicKey)

        const node2 = await createNode()
        const secretStream = node2.connect(server.publicKey)

        expect(
          await new Promise((resolve, reject) => {
            secretStream.on('error', (error) => reject(error))
            secretStream.on('open', () => {
              secretStream.write('hello')
              resolve(true)
            })
          })
        ).to.be.true()
      })
    })

    describe('server.on()', () => {
      it('should emit event "connection"', async () => {
        const node1 = await createNode()

        const server = node1.createServer((secretStream) => {
          secretStream.on('data', (data) =>
            expect(data).to.eql(b4a.from('hello'))
          )
        })

        await server.listen()

        expect(server.publicKey).to.eql(node1.defaultKeyPair.publicKey)

        const node2 = await createNode()
        const secretStream = node2.connect(server.publicKey)

        expect(
          await new Promise((resolve, reject) => {
            secretStream.on('error', (error) => reject(error))
            secretStream.on('open', () => {
              secretStream.write('hello')
              resolve(true)
            })
          })
        ).to.be.true()
      })

      it('should emit event "listening"', async () => {
        const node1 = await createNode()

        const server = node1.createServer()

        server.listen()

        const listening = await new Promise((resolve, reject) => {
          server.on('listening', () => {
            resolve(true)
          })
        })

        expect(listening).to.be.true()
      })

      it('should emit event "close"', async () => {
        const node1 = await createNode()

        const server = node1.createServer()
        await server.listen()

        const closing = await new Promise((resolve, reject) => {
          server.on('close', () => resolve(true))
          server.close()
        })

        expect(closing).to.be.true()
      })
    })

    describe('server.address()', () => {
      it('should return correct address interface', async () => {
        const node1 = await createNode()
        const server = node1.createServer()
        await server.listen(keyPair)

        const address = server.address()

        expect(typeof address.host).to.equal('string')
        expect(typeof address.port).to.equal('number')
        expect(address.publicKey).to.eql(keyPair.publicKey)
      })
    })

    describe('server.publicKey', () => {
      it("should return the server's publicKey", async () => {
        const node1 = await createNode({ keyPair })
        const server = node1.createServer()
        await server.listen()

        expect(server.publicKey).to.equal(keyPair.publicKey)
      })
    })
  })

  describe('Connecting to P2P servers', () => {
    after(cleanNodes)

    it('connect to a remote server', async () => {
      const node = await createNode()

      const encryptedConnection = node.connect(DHT_KEY)

      encryptedConnection.on('error', (error) => {
        throw error
      })

      await new Promise((resolve) => {
        encryptedConnection.on('open', () => {
          expect(encryptedConnection.remotePublicKey).to.eql(DHT_KEY)
          expect(encryptedConnection.publicKey).to.eql(
            node.defaultKeyPair.publicKey
          )

          encryptedConnection.on('data', (data) => {
            expect(data).to.eql(b4a.from('hello'))
            resolve()
          })
        })
      })
    })

    it('connect to a remote server with a custom keyPair', async () => {
      const node = await createNode()

      const customKeyPair = crypto.keyPair(b4a.from('f'.repeat(64), 'hex'))

      const encryptedConnection = node.connect(DHT_KEY, {
        keyPair: customKeyPair
      })

      encryptedConnection.on('error', (error) => {
        throw error
      })

      await new Promise((resolve) => {
        encryptedConnection.on('open', () => {
          expect(encryptedConnection.remotePublicKey).to.eql(DHT_KEY)
          expect(encryptedConnection.publicKey).to.eql(customKeyPair.publicKey)
          expect(encryptedConnection.publicKey).to.not.eql(
            node.defaultKeyPair.publicKey
          )

          encryptedConnection.on('data', (data) => {
            expect(data).to.eql(b4a.from('hello'))
            resolve()
          })
        })
      })
    })
  })

  describe('Additional peer discovery', () => {
    after(cleanNodes)

    async function toArray (iterable) {
      const result = []
      for await (const data of iterable) result.push(data)
      return result
    }

    describe('lookup(topic)', () => {
      it('should lookup a topic and return an iterable stream', async () => {
        const node = await createNode()

        const query = node.lookup(TOPIC)

        const result = await toArray(query)

        const peers = Array.from(
          new Set(result[0].peers.map((p) => b4a.toString(p.publicKey, 'hex')))
        )

        expect(result.length).to.be.at.least(1)
        expect(peers).to.eql([DHT_NODE_KEY])

        const secretStream = node.connect(DHT_KEY)

        await new Promise((resolve) => {
          secretStream.on('open', () => {
            expect(secretStream.remotePublicKey).to.eql(DHT_KEY)
            expect(secretStream.publicKey).to.eql(
              node.defaultKeyPair.publicKey
            )
          })
          secretStream.on('data', (data) => {
            expect(data).to.eql(b4a.from('hello'))
            resolve()
          })
        })
      })
    })

    describe('announce(topic, keyPair)', () => {
      it('should announce a topic using a keyPair', async () => {
        const node1 = await createNode()

        const topic = crypto.keyPair().publicKey

        await node1.announce(topic, node1.defaultKeyPair).finished()
        const stream = await node1.lookup(topic)

        const result = await toArray(stream)

        const peers = Array.from(
          new Set(result[0].peers.map((p) => b4a.toString(p.publicKey, 'hex')))
        )

        expect(result.length).to.be.at.least(1)
        expect(result[0].peers.length).to.be.at.least(1)
        expect(peers).to.includes(
          b4a.toString(node1.defaultKeyPair.publicKey, 'hex')
        )
      })
    })
  })

  describe('Hyperswarm', () => {
    it('should be able to replicate a hypercore over hyperswarm with dht-universal', async () => {
      const dht = await createNode({
        // Make sure it works in the integration test, and not just suppress errors.
        relays: [INVALID_RELAY_SERVER, VALID_RELAY_SERVER]
      })
      const store = new Corestore(ram)
      await store.ready()
      const swarm = new Hyperswarm({ dht })

      const sockets = []

      swarm.on('connection', (socket, info) => {
        sockets.push(socket)
        store.replicate(socket)
      })

      const core = store.get({
        key: Buffer.from(CORE_KEY, 'hex'),
        valueEncoding: 'json'
      })
      await core.ready()

      swarm.join(core.discoveryKey, {
        server: false,
        client: true
      })

      await swarm.flush()

      await core.update()

      expect(core.length).to.eql(2)

      const tail = await core.get(core.length - 1)

      expect(tail).to.eql({ foo: 'bar' })

      await swarm.destroy()
    })
  })

  describe('static create()', () => {
    if (process.title !== 'browser') return

    it('should throw and error in browser if no relays were passed', async () => {
      let err
      try {
        await DHT.create({ relays: [] })
      } catch (error) {
        err = error
      }

      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.equal(
        'DHT relays must be provided in browser environment'
      )
    })

    it('should try relays until one is opened', async () => {
      let err, node

      try {
        node = await DHT.create({
          relays: [INVALID_RELAY_SERVER, VALID_RELAY_SERVER]
        })
      } catch (error) {
        err = error
      }

      expect(err).to.be.undefined()
      node.destroy()
    })

    it('should throw an error if none of the relays opened', async () => {
      let err

      try {
        await DHT.create({
          relays: [INVALID_RELAY_SERVER]
        })
      } catch (error) {
        err = error
      }

      expect(err).to.be.instanceOf(Error)
      expect(err.message).to.equal(
        'Could not connect to any of the provided relays'
      )
    })
  })
}
