import { Game } from '@/types/game'

// In-memory fallback (works for local dev; on Vercel use Redis env vars)
const mem = new Map<string, string>()

async function kget(key: string): Promise<string | null> {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { Redis } = await import('@upstash/redis')
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    return redis.get<string>(key)
  }
  return mem.get(key) ?? null
}

async function kset(key: string, value: string, exSeconds = 86400 * 3): Promise<void> {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { Redis } = await import('@upstash/redis')
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    await redis.setex(key, exSeconds, value)
    return
  }
  mem.set(key, value)
}

export async function getGame(id: string): Promise<Game | null> {
  const raw = await kget(`game:${id}`)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export async function saveGame(game: Game): Promise<void> {
  await kset(`game:${game.id}`, JSON.stringify(game))
}
