import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(num: number, decimals: number = 2): string {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

export function parseFormattedNumber(str: string): number {
  const cleaned = str.replace(/[^\d,-]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

export function roundTo(num: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals)
  return Math.round(num * factor) / factor
}
