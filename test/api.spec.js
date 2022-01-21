import { expect } from 'aegir/utils/chai.js'
import crypto from 'hypercore-crypto'
import ram from 'random-access-memory'
import Hypercore from 'hypercore'
import b4a from 'b4a'

/** @typedef {import ('../src/interfaces').DHT} _DHT */

/**
 * @param {_DHT} DHT
 */
export const test = (DHT) => {
  const {
    DHT_NODE_KEY,
    RELAY_URL: VALID_RELAY_SERVER,
    TOPIC: topic,
    CORE_KEY
  } = process.env

  const TOPIC = b4a.from(topic, 'hex')

  const DHT_KEY = b4a.from(DHT_NODE_KEY, 'hex')

  const keyPair = crypto.keyPair(b4a.from('1'.repeat(64), 'hex'))

  const nodes = []

  /**
   * @param {import('../src/interfaces').DHTOpts} [opts]
   * @returns {Promise<_DHT>}
   */
  const createNode = async (opts) => {
    if (process.title !== 'node') opts = { ...opts, relay: VALID_RELAY_SERVER }

    const node = new DHT(opts)
    nodes.push(node)
    await node.ready()
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
      it.skip('should accept a defaultKeyPair', async () => {
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

      it.skip('should create a server and accept a firewall function', async () => {
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
      it.skip('should listen on the same keyPair as node.defaultKeypair', async () => {
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
      it.skip('should emit event "connection"', async () => {
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

    describe.skip('server.publicKey', () => {
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
      it.skip('should lookup a topic and return a stream with closestNodes', async () => {
        const node = await createNode()

        const query = node.lookup(TOPIC)

        expect(query.closestNodes.length).to.be.at.least(1)
        expect(query.closestNodes[0].id).to.not.be.undefined()
        expect(typeof query.closestNodes[0].host).to.equal('string')
        expect(typeof query.closestNodes[0].port).to.equal('number')
      })

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

      it('should replicate Hypercore', async () => {
        const node = await createNode()

        const core = new Hypercore(ram, b4a.from(CORE_KEY, 'hex'), {
          valueEncoding: 'json'
        })
        await core.ready()

        const query = node.lookup(core.discoveryKey)

        const connections = new Map()

        for await (const { peers } of query) {
          peers.forEach((peer) => {
            const pubKeyString = b4a.toString(peer.publicKey, 'hex')
            if (!connections.has(pubKeyString)) {
              const connection = node.connect(peer.publicKey)
              connections.set(pubKeyString, connection)
            }
          })
        }
        /** @type {import ('stream').Duplex} */
        const replicateStream = core.replicate(true)

        for (const connection of connections.values()) {
          connection.on('error', () => {})
          connection.pipe(replicateStream).pipe(connection)
        }

        await core.update()
        const data = await core.get(core.length - 1)
        expect(data).to.eql({ foo: 'bar' })

        replicateStream.destroy()
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
}
