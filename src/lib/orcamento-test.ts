// Testes puros do motor de cálculo do orçamento (farol comercial).
// Executados via console ao importar (não rodam em CI — verificação manual na tela).
import { calcularOrcamento, limiteDescontoUsuario } from './orcamento'
import type { LinhaOrcamento } from './orcamento'

export function testMotorCalculo(): { nome: string; ok: boolean; detalhe: string }[] {
  const cfg = {
    pct_administrativo: 10,
    pct_financeiro: 8,
    pct_comercial: 7,
    pct_imposto: 8,
    fator_preparacao: 2.0,
    fator_seguranca: 1.15,
    margem_alvo_pct: 30,
  }
  const linhas: LinhaOrcamento[] = [
    {
      tipo: 'hora',
      recurso_nome: 'Consultor A',
      profissional_id: 'p1',
      tipo_hora: 'entrega',
      horas: 10,
      custo_hora: 100,
    },
    {
      tipo: 'componente',
      componente_nome: 'Material impresso',
      unidade: 'participante',
      quantidade: 10,
      valor_unitario: 20,
    },
    {
      tipo: 'componente',
      componente_nome: 'Passagem',
      unidade: 'projeto',
      quantidade: 1,
      valor_unitario: 500,
      reembolsavel: true,
    },
  ]
  const r = calcularOrcamento({
    linhas,
    config: cfg,
    modeloNome: 'Projeto Fechado',
    descontoPct: 0,
  })

  const checks = [
    {
      nome: 'custo direto = 1000 (horas) + 200 (componentes) + 0 (reembolsável fora) + 2000 (preparação 2×)',
      ok: Math.abs(r.custo_direto - 3200) < 0.01,
      detalhe: `custo_direto=${r.custo_direto}`,
    },
    {
      nome: 'overhead 25% → custo c/ overhead 4000',
      ok: Math.abs(r.custo_com_overhead - 4000) < 0.01,
      detalhe: `custo_com_overhead=${r.custo_com_overhead}`,
    },
    {
      nome: 'preço mínimo = 4000×1,15÷0,92 = 5000',
      ok: Math.abs(r.preco_minimo - 5000) < 0.01,
      detalhe: `preco_minimo=${r.preco_minimo}`,
    },
    {
      nome: 'preço sugerido = 4000÷(0,92−0,30) ≈ 6451,61',
      ok: Math.abs(r.preco_sugerido - 4000 / 0.62) < 0.01,
      detalhe: `preco_sugerido=${r.preco_sugerido}`,
    },
    {
      nome: 'reembolsável vai fora (total cliente = preço + 500)',
      ok:
        Math.abs(r.total_reembolsavel - 500) < 0.01 &&
        Math.abs(r.total_ao_cliente - (r.preco_final + 500)) < 0.01,
      detalhe: `total_ao_cliente=${r.total_ao_cliente}`,
    },
    {
      nome: 'margem real ≈ margem alvo sem desconto',
      ok: Math.abs(r.margem_real_pct - 30) < 0.1,
      detalhe: `margem_real_pct=${r.margem_real_pct.toFixed(2)}`,
    },
    {
      nome: 'admin sem limite de desconto',
      ok: limiteDescontoUsuario({ role: 'admin' }, []) === null,
      detalhe: 'null = ilimitado',
    },
    {
      nome: 'perfil sem alçada cadastrada = 0%',
      ok: limiteDescontoUsuario({ role: 'editor' }, []) === 0,
      detalhe: '0%',
    },
    {
      nome: 'perfil com alçada = pct_max',
      ok:
        limiteDescontoUsuario({ role: 'Vendedor' }, [
          { id: 'x', perfil_nome: 'vendedor', pct_max: 10 } as any,
        ]) === 10,
      detalhe: '10%',
    },
  ]
  return checks
}
