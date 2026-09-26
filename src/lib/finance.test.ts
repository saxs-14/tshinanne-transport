import { describe, expect, it } from 'vitest'
import {
  estimatedProfit,
  isValidDateRange,
  operatingCosts,
  outstandingBalance,
  paymentStatus,
  sumFuelCost,
  sumManualExpenses,
  sumReceived,
  sumRevenue,
} from './finance'

describe('paymentStatus', () => {
  it('is unpaid when nothing has been paid', () => {
    expect(paymentStatus(0, 500)).toBe('unpaid')
  })
  it('is partial when some but not all has been paid', () => {
    expect(paymentStatus(200, 500)).toBe('partial')
  })
  it('is paid when the full price has been paid', () => {
    expect(paymentStatus(500, 500)).toBe('paid')
  })
  it('is unpaid for a zero-price delivery with no payment', () => {
    expect(paymentStatus(0, 0)).toBe('unpaid')
  })
})

describe('revenue and payments', () => {
  it('sums delivery prices, ignoring negative/invalid values', () => {
    expect(sumRevenue([{ price: 500 }, { price: -100 }, { price: undefined }, { price: 250 }])).toBe(750)
  })
  it('sums amounts paid', () => {
    expect(sumReceived([{ amountPaid: 200 }, { amountPaid: 300 }])).toBe(500)
  })
  it('never reports a negative outstanding balance', () => {
    expect(outstandingBalance(500, 700)).toBe(0)
    expect(outstandingBalance(500, 200)).toBe(300)
  })
})

describe('operating costs — fuel must not be double-counted', () => {
  it('excludes Fuel-category manual expenses from the manual expense total', () => {
    const expenses = [
      { category: 'Maintenance', amount: 400 },
      { category: 'Fuel', amount: 999 },
    ]
    expect(sumManualExpenses(expenses)).toBe(400)
  })
  it('takes fuel cost only from fuelRecords', () => {
    expect(sumFuelCost([{ amount: 300 }, { amount: 150 }])).toBe(450)
  })
  it('combines manual expenses and fuel exactly once each', () => {
    const manual = sumManualExpenses([{ category: 'Maintenance', amount: 400 }, { category: 'Fuel', amount: 999 }])
    const fuel = sumFuelCost([{ amount: 300 }])
    expect(operatingCosts(manual, fuel)).toBe(700)
  })
})

describe('estimatedProfit', () => {
  it('is revenue minus operating costs', () => {
    expect(estimatedProfit(1000, 400)).toBe(600)
  })
  it('can go negative when costs exceed revenue', () => {
    expect(estimatedProfit(100, 400)).toBe(-300)
  })
})

describe('isValidDateRange', () => {
  it('accepts a from date on or before the to date', () => {
    expect(isValidDateRange('2026-01-01', '2026-01-31')).toBe(true)
    expect(isValidDateRange('2026-01-01', '2026-01-01')).toBe(true)
  })
  it('rejects a from date after the to date', () => {
    expect(isValidDateRange('2026-02-01', '2026-01-01')).toBe(false)
  })
})
