import Dexie, { type EntityTable } from 'dexie'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface PendingWrite {
  id: string
  table: string
  operation: 'insert' | 'update' | 'delete'
  payload: Record<string, unknown>
  createdAt: string
}

class DayframeOfflineDb extends Dexie {
  writes!: EntityTable<PendingWrite, 'id'>

  constructor() {
    super('dayframe-offline')
    this.version(1).stores({ writes: 'id, table, createdAt' })
  }
}

export const offlineDb = new DayframeOfflineDb()

export async function queueWrite(write: Omit<PendingWrite, 'id' | 'createdAt'>) {
  const item: PendingWrite = {
    ...write,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  await offlineDb.writes.add(item)
  return item
}

export async function flushQueuedWrites(client: SupabaseClient) {
  const writes = await offlineDb.writes.orderBy('createdAt').toArray()
  for (const write of writes) {
    let error: { message: string } | null = null
    if (write.operation === 'insert') ({ error } = await client.from(write.table).insert(write.payload))
    if (write.operation === 'update') {
      const { id, ...values } = write.payload
      ;({ error } = await client.from(write.table).update(values).eq('id', id))
    }
    if (write.operation === 'delete') ({ error } = await client.from(write.table).delete().eq('id', write.payload.id))
    if (error) break
    await offlineDb.writes.delete(write.id)
  }
  return offlineDb.writes.count()
}
