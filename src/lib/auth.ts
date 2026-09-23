import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from './firebase'

export function subscribeToAuth(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null)
    return () => undefined
  }
  return onAuthStateChanged(auth, callback)
}