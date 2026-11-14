import { useSyncExternalStore } from 'react'

type Store<T> = { get: () => T; subscribe: (l: () => void) => () => void }

export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}
