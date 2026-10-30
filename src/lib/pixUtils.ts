/**
 * Utilitário puro para geração de Payload EMV do PIX Estático (Padrão BACEN BR Code)
 * com cálculo de CRC16-CCITT (Polinômio 0x1021).
 */

function formatTLV(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0')
  return `${id}${len}${value}`
}

function crc16(payload: string): string {
  let crc = 0xffff
  const polynomial = 0x1021

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff
      } else {
        crc = (crc << 1) & 0xffff
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export interface PixPayloadParams {
  pixKey: string
  merchantName?: string
  merchantCity?: string
  amount?: number
  txid?: string
  description?: string
}

export function generateStaticPixPayload({
  pixKey,
  merchantName = 'Grupo Flavio Moura',
  merchantCity = 'SAO PAULO',
  amount,
  txid = '***',
  description,
}: PixPayloadParams): string {
  // Limpar formatação da chave se for CPF/CNPJ ou telefone
  const cleanKey = pixKey.trim()

  // Normalizar nome e cidade para ASCII sem acentos (EMV standard)
  const normName = merchantName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .slice(0, 25)
    .toUpperCase()

  const normCity = merchantCity
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .slice(0, 15)
    .toUpperCase()

  // 00: Payload Format Indicator = '01'
  let payload = formatTLV('00', '01')

  // 26: Merchant Account Information - GUI + Chave Pix + Info adicional
  let mai = formatTLV('00', 'br.gov.bcb.pix')
  mai += formatTLV('01', cleanKey)
  if (description) {
    mai += formatTLV('02', description.slice(0, 25))
  }
  payload += formatTLV('26', mai)

  // 52: Merchant Category Code = '0000'
  payload += formatTLV('52', '0000')

  // 53: Transaction Currency = '986' (BRL)
  payload += formatTLV('53', '986')

  // 54: Transaction Amount (opcional, com 2 casas decimais)
  if (amount && amount > 0) {
    payload += formatTLV('54', amount.toFixed(2))
  }

  // 58: Country Code = 'BR'
  payload += formatTLV('58', 'BR')

  // 59: Merchant Name
  payload += formatTLV('59', normName || 'RECEBEDOR')

  // 60: Merchant City
  payload += formatTLV('60', normCity || 'SAO PAULO')

  // 62: Additional Data Field Template (txid)
  const normTxid = (txid || '***').replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || '***'
  const adf = formatTLV('05', normTxid)
  payload += formatTLV('62', adf)

  // 63: CRC16 ID + Len
  const payloadToCrc = payload + '6304'
  const crc = crc16(payloadToCrc)

  return payloadToCrc + crc
}
