import pb from '@/lib/pocketbase/client'
import { Produto, EstoqueMovimentacao, VendaMaterial } from '@/lib/types'

export const estoqueService = {
  // PRODUTOS
  async listProdutos(empresaId?: string): Promise<Produto[]> {
    const filter = empresaId && empresaId !== 'todas' ? `empresa_id = "${empresaId}"` : ''
    return await pb.collection('v1_produtos').getFullList<Produto>({
      filter,
      sort: 'nome',
      expand: 'empresa_id',
    })
  },

  async getProduto(id: string): Promise<Produto> {
    return await pb.collection('v1_produtos').getOne<Produto>(id, {
      expand: 'empresa_id',
    })
  },

  async gerarProximoCodigo(): Promise<string> {
    try {
      const records = await pb.collection('v1_produtos').getFullList({
        sort: '-created',
        limit: 10,
      })
      const count = (await pb.collection('v1_produtos').getFullList()).length
      const nextNum = count + 1
      const year = new Date().getFullYear().toString().slice(-2)
      return `PRD-${year}-${String(nextNum).padStart(4, '0')}`
    } catch {
      const rnd = Math.floor(1000 + Math.random() * 9000)
      return `PRD-${rnd}`
    }
  },

  async createProduto(data: Partial<Produto>): Promise<Produto> {
    const codigo = data.codigo || (await this.gerarProximoCodigo())
    return await pb.collection('v1_produtos').create<Produto>({
      ...data,
      codigo,
      estoque_atual: Number(data.estoque_atual) || 0,
      estoque_minimo: Number(data.estoque_minimo) || 0,
      preco_compra: Number(data.preco_compra) || 0,
      preco_venda: Number(data.preco_venda) || 0,
      ano_publicacao: data.ano_publicacao ? Number(data.ano_publicacao) : undefined,
      ativo: data.ativo ?? true,
    })
  },

  async updateProduto(id: string, data: Partial<Produto>): Promise<Produto> {
    return await pb.collection('v1_produtos').update<Produto>(id, data)
  },

  async deleteProduto(id: string): Promise<boolean> {
    return await pb.collection('v1_produtos').delete(id)
  },

  // MOVIMENTAÇÕES DE ESTOQUE (ENTRADAS / SAÍDAS / AJUSTES)
  async listMovimentacoes(empresaId?: string): Promise<EstoqueMovimentacao[]> {
    const filter = empresaId && empresaId !== 'todas' ? `empresa_id = "${empresaId}"` : ''
    return await pb.collection('v1_estoque_movimentacoes').getFullList<EstoqueMovimentacao>({
      filter,
      sort: '-data,-created',
      expand: 'produto_id,empresa_id',
    })
  },

  async registrarEntrada(params: {
    produto_id: string
    quantidade: number
    custo_unitario?: number
    nf_numero?: string
    data: string
    observacao?: string
    empresa_id?: string
  }): Promise<EstoqueMovimentacao> {
    const qtd = Number(params.quantidade) || 0
    const custo = Number(params.custo_unitario) || 0
    const valor_total = qtd * custo

    // 1. Criar movimentação
    const mov = await pb.collection('v1_estoque_movimentacoes').create<EstoqueMovimentacao>({
      produto_id: params.produto_id,
      tipo: 'entrada',
      quantidade: qtd,
      custo_unitario: custo,
      valor_total,
      nf_numero: params.nf_numero || '',
      data: params.data,
      observacao: params.observacao || '',
      empresa_id: params.empresa_id || '',
    })

    // 2. Atualizar estoque e preço de compra do produto
    try {
      const prod = await pb.collection('v1_produtos').getOne<Produto>(params.produto_id)
      const novoEstoque = (Number(prod.estoque_atual) || 0) + qtd
      const updateData: any = { estoque_atual: novoEstoque }
      if (custo > 0) {
        updateData.preco_compra = custo
      }
      await pb.collection('v1_produtos').update(params.produto_id, updateData)
    } catch (err) {
      console.error('Erro ao atualizar estoque do produto:', err)
    }

    return mov
  },

  // VENDAS DE MATERIAIS
  async listVendas(empresaId?: string): Promise<VendaMaterial[]> {
    const filter = empresaId && empresaId !== 'todas' ? `empresa_id = "${empresaId}"` : ''
    return await pb.collection('v1_vendas_materiais').getFullList<VendaMaterial>({
      filter,
      sort: '-data_venda,-created',
      expand: 'cliente_id,empresa_id,transacao_id',
    })
  },

  async getVenda(id: string): Promise<VendaMaterial> {
    return await pb.collection('v1_vendas_materiais').getOne<VendaMaterial>(id, {
      expand: 'cliente_id,empresa_id,transacao_id',
    })
  },

  async gerarProximoNumeroPedido(): Promise<string> {
    try {
      const count = (await pb.collection('v1_vendas_materiais').getFullList()).length
      const nextNum = count + 1
      const year = new Date().getFullYear()
      return `PED-${year}-${String(nextNum).padStart(4, '0')}`
    } catch {
      const rnd = Math.floor(1000 + Math.random() * 9000)
      return `PED-${rnd}`
    }
  },

  async registrarVenda(params: {
    cliente_id: string
    cliente_nome?: string
    cliente_documento?: string
    cliente_endereco?: string
    itens: {
      produto_id: string
      codigo?: string
      descricao: string
      quantidade: number
      preco_unitario: number
      desconto: number
      total: number
    }[]
    desconto?: number
    nf_numero?: string
    data_venda: string
    observacoes?: string
    forma_pagamento?: string
    empresa_id?: string
    criarTransacaoFinanceira?: boolean
    conta_id?: string
  }): Promise<VendaMaterial> {
    const numero_pedido = await this.gerarProximoNumeroPedido()
    const subtotal = params.itens.reduce(
      (acc, it) => acc + (it.quantidade * it.preco_unitario - (it.desconto || 0)),
      0,
    )
    const descontoGeral = Number(params.desconto) || 0
    const valor_total = Math.max(0, subtotal - descontoGeral)

    let transacaoId: string | undefined

    // 1. Opcionalmente gera lançamento financeiro em v1_transactions (Conta a Receber)
    if (params.criarTransacaoFinanceira) {
      try {
        const desc = `Venda de Materiais ${numero_pedido} - ${params.cliente_nome || 'Cliente'}`
        const tx = await pb.collection('v1_transactions').create({
          description: desc,
          amount: valor_total,
          type: 'Receita',
          status: 'Pago',
          category: 'Venda de Materiais/Livros',
          date: params.data_venda,
          client_id: params.cliente_id,
          document_number: params.nf_numero || numero_pedido,
          empresa_id: params.empresa_id || '',
          conta_id: params.conta_id || '',
        })
        transacaoId = tx.id
      } catch (err) {
        console.error('Falha ao criar transacao financeira vinculada a venda:', err)
      }
    }

    // 2. Registrar a venda
    const venda = await pb.collection('v1_vendas_materiais').create<VendaMaterial>({
      numero_pedido,
      cliente_id: params.cliente_id,
      cliente_nome: params.cliente_nome || '',
      cliente_documento: params.cliente_documento || '',
      cliente_endereco: params.cliente_endereco || '',
      itens_json: params.itens,
      subtotal,
      desconto: descontoGeral,
      valor_total,
      nf_numero: params.nf_numero || '',
      data_venda: params.data_venda,
      observacoes: params.observacoes || '',
      status: 'concluida',
      forma_pagamento: params.forma_pagamento || 'PIX',
      transacao_id: transacaoId || '',
      empresa_id: params.empresa_id || '',
    })

    // 3. Baixar estoque de cada item e registrar movimentação de saída
    for (const item of params.itens) {
      try {
        const prod = await pb.collection('v1_produtos').getOne<Produto>(item.produto_id)
        const novoEstoque = Math.max(0, (Number(prod.estoque_atual) || 0) - item.quantidade)
        await pb.collection('v1_produtos').update(item.produto_id, {
          estoque_atual: novoEstoque,
        })

        await pb.collection('v1_estoque_movimentacoes').create({
          produto_id: item.produto_id,
          tipo: 'saida',
          quantidade: item.quantidade,
          custo_unitario: item.preco_unitario,
          valor_total: item.total,
          nf_numero: params.nf_numero || '',
          data: params.data_venda,
          observacao: `Venda ${numero_pedido} - Cliente: ${params.cliente_nome || ''}`,
          empresa_id: params.empresa_id || '',
        })
      } catch (err) {
        console.error(`Erro ao dar baixa no estoque do produto ${item.produto_id}:`, err)
      }
    }

    return venda
  },

  async deleteVenda(id: string): Promise<boolean> {
    return await pb.collection('v1_vendas_materiais').delete(id)
  },
}
