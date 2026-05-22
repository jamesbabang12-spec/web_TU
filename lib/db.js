import { MongoClient } from 'mongodb'

function getClientPromise() {
  if (!global._mongoClientPromise) {
    const uri = process.env.MONGO_URL
    if (!uri) {
      throw new Error('MONGO_URL environment variable is not set')
    }
    const client = new MongoClient(uri)
    global._mongoClientPromise = client.connect()
  }
  return global._mongoClientPromise
}

export async function getDb() {
  const c = await getClientPromise()
  const dbName = process.env.DB_NAME || 'sekolahku'
  return c.db(dbName)
}

export async function getCollection(name) {
  const db = await getDb()
  return db.collection(name)
}
