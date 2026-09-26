export type PaymentStatus = 'unpaid' | 'partial' | 'paid'

type MoneyLike = { amount?: number; category?: string }
type DeliveryLike = { price?: number; amountPaid?: number }

const positive = (v: unknown) => Math.max(0, Number(v) || 0)

export function paymentStatus(amountPaid: number, price: number): PaymentStatus {
  if (amountPaid <= 0) return 'unpaid'
  if (amountPaid >= price && price > 0) return 'paid'
  return 'partial'
}

export function sumRevenue(deliveries: DeliveryLike[]): number {
  return deliveries.reduce((sum, d) => sum + positive(d.price), 0)
}

export function sumReceived(deliveries: DeliveryLike[]): number {
  return deliveries.reduce((sum, d) => sum + positive(d.amountPaid), 0)
}

/** Manual expenses categorised as "Fuel" are excluded — fuel cost comes from fuelRecords, never both. */
export function sumManualExpenses(expenses: MoneyLike[]): number {
  return expenses.reduce((sum, e) => sum + (e.category === 'Fuel' ? 0 : positive(e.amount)), 0)
}

export function sumFuelCost(fuelRecords: MoneyLike[]): number {
  return fuelRecords.reduce((sum, f) => sum + positive(f.amount), 0)
}

/** operating costs = manual expenses (excluding Fuel-category) + recorded fuel cost */
export function operatingCosts(manualExpenses: number, fuelCost: number): number {
  return manualExpenses + fuelCost
}

/** estimated profit = revenue - operating costs */
export function estimatedProfit(revenue: number, costs: number): number {
  return revenue - costs
}

export function outstandingBalance(revenue: number, received: number): number {
  return Math.max(0, revenue - received)
}

export function isValidDateRange(from: string, to: string): boolean {
  return from <= to
}
