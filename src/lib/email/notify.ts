import 'server-only'
import { Resend } from 'resend'

/** Avvisa il boss di una nuova richiesta di pagamento. Non lancia mai: l'email è un di più. */
export async function notifyPaymentRequest(input: {
  nome: string
  importo: number
  datiPagamento: string | null
  codice: string
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.BOSS_NOTIFY_EMAIL
  const from = process.env.EMAIL_FROM
  if (!apiKey || !to || !from) {
    console.warn('[notifyPaymentRequest] Config email mancante, salto invio')
    return
  }
  try {
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from,
      to,
      subject: `Nuova richiesta di pagamento: ${input.nome} (${input.importo.toFixed(2)} €)`,
      text:
        `Il cliente ${input.nome} (codice ${input.codice}) ha richiesto il pagamento di ${input.importo.toFixed(2)} €.\n` +
        `Dati di pagamento: ${input.datiPagamento ?? '— (da inserire nel pannello)'}\n\n` +
        `Gestisci la richiesta: /admin/richieste`,
    })
  } catch (err) {
    console.error('[notifyPaymentRequest] Invio email fallito:', err)
  }
}
