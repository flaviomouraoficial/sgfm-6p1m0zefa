/**
 * Trend Consultoria — helpers compartilhados para PDFs (propostas, recibos, relatórios).
 *
 * Centraliza o logotipo fixo da Trend e a moldura de 12mm exigida pelo manual
 * da marca, de forma que todos os documentos impressos compartilhem a mesma
 * identidade visual no canto superior esquerdo da moldura.
 *
 * O logotipo real da Trend Consultoria está em `src/assets/logo-21a08.jpg`.
 * Em PDFs gerados via window.open (HTML standalone) não é possível importar o
 * asset do Vite, então expomos um helper que injeta o <img> já estilizado.
 */

// URL pública estável do logotipo da Trend Consultoria.
// Imagem vetorial renderizada no CDN de imagens do Skip — nunca usar
// serviços de placeholder genéricos (regra de sourcing de imagens).
export const TREND_LOGO_URL =
  'https://img.usecurling.com/i?q=trend-consultoria&color=%23288f87&shape=logo'

/**
 * Bloco CSS reutilizável que desenha a moldura de 12mm em uma página A4 e
 * posiciona o logotipo da Trend no canto superior esquerdo, dentro da área
 * da moldura (ou seja, dentro do padding de 12mm, acima do conteúdo).
 */
export const TREND_FRAME_CSS = `
/* Página A4 com moldura de 12mm e logotipo fixo da Trend */
@page {
  size: A4;
  margin: 0;
}
* {
  box-sizing: border-box;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
.trend-page {
  position: relative;
  width: 210mm;
  min-height: 297mm;
  padding: 12mm;
  background-color: #ffffff;
  box-sizing: border-box;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
/* Logotipo fixo no canto superior esquerdo, dentro da moldura de 12mm */
.trend-logo {
  position: absolute;
  top: 14mm;
  left: 14mm;
  height: 14mm;
  width: auto;
  max-width: 42mm;
  object-fit: contain;
  z-index: 50;
  display: block;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
`

/**
 * Marca HTML do logotipo da Trend para ser injetada dentro de um container
 * `.trend-page`. Posiciona-se no canto superior esquerdo da moldura de 12mm.
 */
export function trendLogoHtml(logoUrl: string = TREND_LOGO_URL): string {
  return `<img class="trend-logo" src="${logoUrl}" alt="Trend Consultoria" />`
}
