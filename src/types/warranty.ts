export interface Warranty {
  id: string;
  name: string;
  durationDays: number;
  description: string;
  warrantyTerms: string;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WarrantyFormData {
  id?: string;
  name: string;
  durationDays: number;
  warrantyTerms: string;
}

export const DEFAULT_WARRANTIES = [
  {
    name: 'Garantia 90 Dias',
    durationDays: 90,
    isDefault: true,
    warrantyTerms: `Prazo de Garantia: Conforme estabelecido pela Lei nº 8.078/1990 (Código de Defesa do Consumidor), a garantia para os serviços de manutenção prestados pela Empresa será de 90 (noventa) dias contados a partir da data de entrega do aparelho ao Cliente, conforme comprovado pelo recibo de retirada do celular.

Abrangência da Garantia: A garantia abrange todos os defeitos relacionados aos serviços de manutenção realizados nesta O.S., incluindo peças substituídas e mão de obra. No entanto, a garantia não cobre danos causados por mau uso, acidentes, exposição a líquidos, quedas, intervenção de terceiros não autorizados, instalação inadequada de aplicativos ou atualizações de software não recomendadas.

Exclusão de Garantia em Caso de Oxidação ou Contato com Líquidos: De acordo com o Código de Defesa do Consumidor, Lei nº 8.078/1990, artigo 12, parágrafo 3º, e com base na jurisprudência aplicável, a garantia não terá cobertura para serviços de Oxidação e não cobrirá quaisquer danos aos demais serviços decorrentes de oxidação, corrosão ou contato com líquidos que tenham afetado o serviço de manutenção realizado pela Empresa.

Procedimento em Caso de Reclamação: Se o Cliente detectar qualquer defeito ou não conformidade no celular após a manutenção, ele deverá notificar a Empresa imediatamente, apresentando o aparelho e o comprovante de garantia. A Empresa compromete-se a avaliar o aparelho e, se constatada a falha decorrente dos serviços de manutenção prestados, realizará os reparos necessários sem custos adicionais ao Cliente.

Reserva de Direitos: A Empresa reserva-se o direito de decidir, com base em sua avaliação técnica, se a garantia será aplicada. Caso a Empresa constate que o defeito não é decorrente dos serviços de manutenção realizados, o Cliente será informado e poderá solicitar um orçamento para reparo.

Disposições Finais:
Este Termo de Garantia está em conformidade com as disposições legais do Código de Defesa do Consumidor. O Cliente declara estar ciente e de acordo com os termos e condições deste Termo de Garantia, especialmente os artigos 18 a 26 da Lei nº 8.078/1990.`
  },
  {
    name: 'Sem Garantia',
    durationDays: 0,
    isDefault: true,
    warrantyTerms: `Esta Ordem de Serviço não possui garantia sobre os serviços prestados.
A empresa não se responsabiliza por falhas futuras, mau uso, quedas, contato com líquidos ou qualquer outro dano ao aparelho após a retirada pelo cliente.
O cliente declara estar ciente de que a prestação do serviço foi realizada sem a cobertura de garantia e que qualquer novo reparo estará sujeito a nova cobrança.`
  }
];
