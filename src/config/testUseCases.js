/**
 * Test users for the hospital app.
 * Each user has a UID and fingerprint ID for login.
 */
export const USE_CASE_STORAGE_KEY = 'app_use_case_id'

export const TEST_USE_CASES = [
  {
    id: 'user-1',
    userId: 1,
    name: 'Omar Belhamid',
    uid: 'USER-1',
    fingerprintId: 'fp_omar_belhamid',
    label: 'Omar Belhamid',
  },
  {
    id: 'user-2',
    userId: 2,
    name: 'Lahcen Kazaz',
    uid: 'USER-2',
    fingerprintId: 'fp_lahcen_kazaz',
    label: 'Lahcen Kazaz',
  },
]

const allUids = new Set(TEST_USE_CASES.flatMap((u) => [u.uid, u.fingerprintId]))

export function validateAccessCode(input) {
  if (!input || typeof input !== 'string') return null
  const trimmed = input.trim().toUpperCase()
  const match = TEST_USE_CASES.find(
    (u) => u.uid === trimmed || u.fingerprintId.toUpperCase() === trimmed
  )
  return match ?? null
}

export function isValidFingerprintId(id) {
  return id && allUids.has(id)
}

export function getUseCaseByFingerprintId(id) {
  return TEST_USE_CASES.find(
    (u) => u.fingerprintId === id || u.fingerprintId.toUpperCase() === (id || '').toUpperCase()
  ) ?? null
}

export function getUseCaseByUid(uid) {
  return TEST_USE_CASES.find(
    (u) => u.uid === uid || u.uid.toUpperCase() === (uid || '').toUpperCase()
  ) ?? null
}

export function getStoredUseCaseId() {
  try {
    return sessionStorage.getItem(USE_CASE_STORAGE_KEY) || null
  } catch {
    return null
  }
}

export function getUseCaseById(id) {
  return TEST_USE_CASES.find((u) => u.id === id) ?? null
}
