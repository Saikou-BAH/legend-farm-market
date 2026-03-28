'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateAdminReturn } from '@/lib/actions/returns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import type { AdminReturnDetail } from '@/types'

interface ReturnManagementPanelProps {
  returnRequest: AdminReturnDetail
}

export function ReturnManagementPanel({ returnRequest }: ReturnManagementPanelProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState(returnRequest.status)
  const [resolution, setResolution] = useState(returnRequest.resolution ?? 'refund')
  const [refundAmount, setRefundAmount] = useState(
    returnRequest.refund_amount !== null ? String(returnRequest.refund_amount) : ''
  )
  const [adminNotes, setAdminNotes] = useState(returnRequest.admin_notes ?? '')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traitement admin du retour</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Statut</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as AdminReturnDetail['status'])}
              className="flex h-11 w-full rounded-2xl border border-input bg-background px-4 py-2 text-sm"
            >
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
              <option value="completed">completed</option>
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Resolution</span>
            <select
              value={resolution}
              onChange={(event) =>
                setResolution(event.target.value as 'refund' | 'credit' | 'exchange')
              }
              className="flex h-11 w-full rounded-2xl border border-input bg-background px-4 py-2 text-sm"
            >
              <option value="refund">Remboursement</option>
              <option value="credit">Avoir</option>
              <option value="exchange">Echange</option>
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Montant rembourse</span>
            <input
              value={refundAmount}
              onChange={(event) => setRefundAmount(event.target.value)}
              className="flex h-11 w-full rounded-2xl border border-input bg-background px-4 py-2 text-sm"
              placeholder="Montant GNF"
            />
          </label>
        </div>

        <label className="space-y-2 text-sm">
          <span className="font-medium">Notes admin</span>
          <textarea
            value={adminNotes}
            onChange={(event) => setAdminNotes(event.target.value)}
            className="flex min-h-[8rem] w-full rounded-[1.25rem] border border-input bg-background px-4 py-3 text-sm"
            placeholder="Decision prise, contexte SAV, suivi logistique..."
          />
        </label>

        <Button
          type="button"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              const result = await updateAdminReturn({
                id: returnRequest.id,
                status,
                resolution,
                refundAmount,
                adminNotes,
              })

              if (!result.success) {
                toast({
                  title: 'Mise a jour impossible',
                  description: result.error,
                  variant: 'destructive',
                })
                return
              }

              toast({
                title: 'Retour mis a jour',
                description: 'Le traitement du retour a bien ete enregistre.',
              })
              router.refresh()
            })
          }}
        >
          {isPending ? 'Enregistrement...' : 'Enregistrer le traitement'}
        </Button>
      </CardContent>
    </Card>
  )
}
