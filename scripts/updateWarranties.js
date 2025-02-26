import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNPz1MXtDvVEHOQCGpQnBoVEPAyqnK0NY",
  authDomain: "sis-genius.firebaseapp.com",
  projectId: "sis-genius",
  storageBucket: "sis-genius.appspot.com",
  messagingSenderId: "1026475975023",
  appId: "1:1026475975023:web:8b5e3b5f1a49d8f25ae4e6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const warranty90Days = {
  warrantyTerms: `<b><span style="direction: ltr; unicode-bidi: embed;">Prazo de Garantia: </span></b>Conforme estabelecido pela <b><span style="direction: ltr; unicode-bidi: embed;">Lei nº 8.078/1990 (Código de Defesa do Consumidor)</span></b>, a garantia para os serviços de manutenção prestados pela Empresa será <b><span style="direction: ltr; unicode-bidi: embed;">de 90 (noventa) dias contados</span></b> a partir da data de entrega do aparelho ao Cliente, conforme comprovado pelo recibo de retirada do celular.&nbsp;<div><br></div><div><span style="direction: ltr; unicode-bidi: embed;"></span><span style="direction: ltr; unicode-bidi: embed;"></span><b><span style="direction: ltr; unicode-bidi: embed;">Abrangência da Garantia:</span></b> A garantia abrange todos os defeitos relacionados aos serviços de manutenção realizados nesta O.S., incluindo peças substituídas e mão de obra. No entanto, a garantia não cobre danos causados por mau uso, acidentes, exposição a líquidos, quedas, intervenção de terceiros não autorizados, instalação inadequada de aplicativos ou atualizações de software não recomendadas.&nbsp;</div><div><br></div><div><span style="direction: ltr; unicode-bidi: embed;"></span><b><span style="direction: ltr; unicode-bidi: embed;">Exclusão de Garantia em Caso de Oxidação ou Contato com Líquidos:</span></b> De acordo com o Código de Defesa do Consumidor, Lei nº 8.078/1990, artigo 12, parágrafo 3º, e com base na jurisprudência aplicável, a garantia não terá cobertura para serviços de Oxidação e não cobrirá quaisquer danos aos demais serviços decorrentes de oxidação, corrosão ou contato com líquidos que tenham afetado o serviço de manutenção realizado pela Empresa.</div><div><span style="direction: ltr; unicode-bidi: embed;"></span><br></div><div><span style="direction: ltr; unicode-bidi: embed;"></span><b><span style="direction: ltr; unicode-bidi: embed;">Procedimento em Caso de Reclamação:</span></b> Se o Cliente detectar qualquer defeito ou não conformidade no celular após a manutenção, ele deverá notificar a Empresa imediatamente, apresentando o aparelho e o comprovante de garantia. A Empresa compromete-se a avaliar o aparelho e, se constatada a falha decorrente dos serviços de manutenção prestados, realizará os reparos necessários sem custos adicionais ao Cliente. <br><span style="direction: ltr; unicode-bidi: embed;"></span><br><span style="direction: ltr; unicode-bidi: embed;"></span><b><span style="direction: ltr; unicode-bidi: embed;">Reserva de Direitos:&nbsp;<span style="direction: ltr; unicode-bidi: embed;"></span><span style="direction: ltr; unicode-bidi: embed;"></span></span></b>A Empresa reserva-se o direito de decidir, com base em sua avaliação técnica, se a garantia será aplicada. Caso a Empresa constate que o defeito não é decorrente dos serviços de manutenção realizados, o Cliente será informado e poderá solicitar um orçamento para reparo.&nbsp;</div><div><br></div><div><span style="direction: ltr; unicode-bidi: embed;"></span><b><span style="direction: ltr; unicode-bidi: embed;">Disposições Finais:</span></b><br><span style="direction: ltr; unicode-bidi: embed;"></span>Este Termo de Garantia está em conformidade com as disposições legais do Código de Defesa do Consumidor. O Cliente declara estar ciente e de acordo com os termos e condições deste Termo de Garantia, especialmente os<b><span style="direction: ltr; unicode-bidi: embed;"> artigos 18 a 26 da Lei nº 8.078/1990.</span></b></div>`
};

const noWarranty = {
  warrantyTerms: `<b><span style="direction: ltr; unicode-bidi: embed;">ATENÇÃO<br></span></b><span style="direction: ltr; unicode-bidi: embed;"></span><span style="direction: ltr; unicode-bidi: embed;"></span><span style="direction: ltr; unicode-bidi: embed;"></span><span style="direction: ltr; unicode-bidi: embed;"></span><span style="direction: ltr; unicode-bidi: embed;"></span><span style="direction: ltr; unicode-bidi: embed;"></span><span style="direction: ltr; unicode-bidi: embed;"></span><span style="direction: ltr; unicode-bidi: embed;"></span><br><span style="direction: ltr; unicode-bidi: embed;"></span>Esta Ordem de Serviço não possui garantia sobre os serviços prestados. <br><span style="direction: ltr; unicode-bidi: embed;"></span><br><span style="direction: ltr; unicode-bidi: embed;"></span><b><span style="direction: ltr; unicode-bidi: embed;">A empresa não se responsabiliza</span></b> por falhas futuras, mau uso, quedas, contato com líquidos ou qualquer outro dano ao aparelho após a retirada pelo cliente. <br><span style="direction: ltr; unicode-bidi: embed;"></span><br><span style="direction: ltr; unicode-bidi: embed;"></span><b><span style="direction: ltr; unicode-bidi: embed;">O cliente declara estar ciente</span></b> de que está&nbsp;<span style="direction: ltr; unicode-bidi: embed;"></span><span style="direction: ltr; unicode-bidi: embed;"></span><span style="direction: ltr; unicode-bidi: embed;"></span><span style="direction: ltr; unicode-bidi: embed;"></span><span style="direction: ltr; unicode-bidi: embed;"></span><span style="direction: ltr; unicode-bidi: embed;"></span>prestação do serviço foi realizada sem a cobertura de garantia e que qualquer novo reparo estará sujeito a nova cobrança.`
};

async function updateWarranties() {
  try {
    // Update warranty-90-days
    const warranty90DaysRef = doc(db, 'warranties', 'warranty-90-days');
    await updateDoc(warranty90DaysRef, warranty90Days);
    console.log('Updated 90 days warranty');

    // Update warranty-no-warranty
    const noWarrantyRef = doc(db, 'warranties', 'warranty-no-warranty');
    await updateDoc(noWarrantyRef, noWarranty);
    console.log('Updated no warranty');

    console.log('All warranties updated successfully');
  } catch (error) {
    console.error('Error updating warranties:', error);
    throw error;
  }
}

updateWarranties();
