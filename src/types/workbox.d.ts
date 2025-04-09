// This file provides missing type definitions for workbox-core

interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<unknown>): void;
}

interface ExtendableMessageEvent extends ExtendableEvent {
  readonly data?: unknown;
  readonly lastEventId: string;
  readonly origin: string;
  readonly ports: ReadonlyArray<MessagePort>;
  readonly source: Client | ServiceWorker | MessagePort | null;
}
