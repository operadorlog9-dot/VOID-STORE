module.exports = {
  roles: {
    staff: 'Equipe VOID',
    buyer: 'Comprador VOID'
  },
  categories: {
    inicio: 'INÍCIO',
    loja: 'LOJA',
    suporte: 'SUPORTE',
    staff: 'STAFF'
  },
  channels: {
    inicio: [
      ['boas-vindas', 'Boas-vindas da VOID STORE.'],
      ['regras', 'Regras oficiais da VOID STORE.'],
      ['avisos', 'Avisos e novidades da loja.'],
      ['como-comprar', 'Passo a passo para comprar com segurança.']
    ],
    loja: [
      ['catalogo', 'Catálogo de produtos da VOID STORE.'],
      ['nitro', 'Produtos e informações relacionadas ao Discord Nitro.'],
      ['estoque', 'Disponibilidade de produtos.'],
      ['promocoes', 'Promoções vigentes.']
    ],
    suporte: [
      ['comprar', 'Inicie uma compra usando /comprar.'],
      ['abrir-ticket', 'Abra atendimento usando /ticket.'],
      ['suporte', 'Canal geral de suporte.'],
      ['avaliacoes', 'Avaliações de clientes com compra confirmada.']
    ],
    staff: [
      ['pedidos', 'Acompanhamento interno de pedidos.'],
      ['logs', 'Registros internos do bot.'],
      ['painel-staff', 'Área interna da equipe.']
    ]
  }
};
