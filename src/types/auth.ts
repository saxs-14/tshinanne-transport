export type UserRole = 'owner' | 'driver'

export interface UserProfile {
  uid: string
  displayName: string
  phone: string
  role: UserRole
  active: boolean
  assignedTruckId?: string
}