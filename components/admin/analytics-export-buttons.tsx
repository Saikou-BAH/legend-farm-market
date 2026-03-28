'use client'

import { Button } from '@/components/ui/button'

interface AnalyticsExportButtonsProps {
  ordersByStatus: Array<{ label: string; value: number }>
  paymentsByStatus: Array<{ label: string; value: number }>
  topCategories: Array<{ label: string; value: number }>
}

function downloadCsv(fileName: string, rows: string[][]) {
  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`)
        .join(',')
    )
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export function AnalyticsExportButtons({
  ordersByStatus,
  paymentsByStatus,
  topCategories,
}: AnalyticsExportButtonsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          downloadCsv('analytics-commandes.csv', [
            ['statut', 'volume'],
            ...ordersByStatus.map((item) => [item.label, String(item.value)]),
          ])
        }
      >
        Export commandes CSV
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          downloadCsv('analytics-paiements.csv', [
            ['statut', 'volume'],
            ...paymentsByStatus.map((item) => [item.label, String(item.value)]),
          ])
        }
      >
        Export paiements CSV
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          downloadCsv('analytics-categories.csv', [
            ['categorie', 'volume'],
            ...topCategories.map((item) => [item.label, String(item.value)]),
          ])
        }
      >
        Export categories CSV
      </Button>
    </div>
  )
}
