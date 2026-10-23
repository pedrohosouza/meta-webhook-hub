import { EventEmitter } from 'node:events'

const CHANGE_EVENT = 'change'
const globalHub = globalThis as unknown as { hubEvents?: EventEmitter }

function emitter() {
  globalHub.hubEvents ??= new EventEmitter().setMaxListeners(0)
  return globalHub.hubEvents
}

export function subscribeHubChanges(listener: () => void) {
  emitter().on(CHANGE_EVENT, listener)
  return () => emitter().off(CHANGE_EVENT, listener)
}

/** Avisa as telas abertas que métricas ou contagens mudaram. Nunca interrompe quem notificou. */
export function notifyHubChange() {
  try {
    emitter().emit(CHANGE_EVENT)
  } catch (error) {
    console.error('[hub-events]', error)
  }
}
