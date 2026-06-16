import { createClient } from "redis";
import {
  resolveEngineResponse,
  waitForEngineResponse,
} from "../store/pendingResponses.store.js";
import type {
  EngineCommandType,
  EngineRequest,
  EngineResponse,
} from "../types/engine.types.js";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const incomingQueue = process.env.INCOMING_QUEUE ?? "backend-to-engine-broker";
const backendQueueId = process.env.BACKEND_QUEUE_ID ?? crypto.randomUUID();
const responseQueue = `response-queue-${backendQueueId}`;
const engineTimeoutMs = Number(process.env.ENGINE_TIMEOUT_MS ?? "30000");

const publisher = createClient({ url: redisUrl });
const subscriber = createClient({ url: redisUrl });

publisher.on("error", (error) => {
  console.error("Redis publisher error:", error);
});

subscriber.on("error", (error) => {
  console.error("Redis subscriber error:", error);
});

export async function connectRedis(): Promise<void> {
  await Promise.all([publisher.connect(), subscriber.connect()]);
  console.log("Successfully connected to Redis");
}

export async function sendToEngine(
  type: EngineCommandType,
  payload: Record<string, unknown>,
): Promise<EngineResponse> {
  const correlationId = crypto.randomUUID();
  const responsePromise = waitForEngineResponse(correlationId, engineTimeoutMs);

  const message: EngineRequest = {
    correlationId,
    responseQueue,
    type,
    payload,
  };

  // put the message at the front and convert it to string for redis to understand
  await publisher.lPush(incomingQueue, JSON.stringify(message));
  return responsePromise;
}

export async function listenForEngineResponses(): Promise<void> {
  console.log(`Listening for engine responses on ${responseQueue}`);

  for (;;) {
    // Infinite loop
    try {
      const response = await subscriber.brPop(responseQueue, 0);
      if (!response) continue;
      const parsed = JSON.parse(response.element) as EngineResponse;
      resolveEngineResponse(parsed);
    } catch (error) {
      console.error("Error processing engine response queue:", error);
    }
  }
}
// lPush and brPop ensure a FIFO structure
