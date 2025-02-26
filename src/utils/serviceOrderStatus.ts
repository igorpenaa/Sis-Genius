export const serviceOrderStatus = {
  quote: 'Orçamento',
  open: 'Aberto',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  canceled: 'Cancelado',
  awaiting_parts: 'Aguardando Peças',
  approved: 'Aprovado',
  warranty_return: 'Retorno Garantia'
} as const;

export type ServiceOrderStatus = keyof typeof serviceOrderStatus;