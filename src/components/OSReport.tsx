import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Estilização do relatório
const styles = StyleSheet.create({
  page: { padding: 20 },
  header: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', borderBottom: '2px solid #ccc', paddingBottom: 10 },
  section: { marginBottom: 10 },
  table: { display: 'table', width: '100%', borderCollapse: 'collapse' },
  row: { flexDirection: 'row' },
  cell: { border: '1px solid #ccc', padding: 5 },
  boldText: { fontWeight: 'bold' },
});

const OSReport = ({ data }) => {
  // Verificar se os dados estão completos
  if (!data || !data.company || !data.serviceOrder || !data.client || !data.equipment) {
    console.error('Dados do relatório estão incompletos:', data);
    return null; // Retornar null se os dados não estiverem completos
  }

  return (
    <Document>
      <Page style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text>LOGO</Text>
          <Text style={styles.boldText}>{data.company.name}</Text>
          <Text>Contato: {data.company.contact}</Text>
        </View>

        {/* Linha de Identificação da O.S. */}
        <View style={styles.section}>
          <Text style={styles.boldText}>ORDEM DE SERVIÇO #{data.serviceOrder.id}</Text>
          <Text>Data de Emissão: {data.serviceOrder.issueDate}</Text>
        </View>

        {/* Tabela de Status e Datas */}
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={styles.cell}>STATUS</Text>
            <Text style={styles.cell}>DATA INICIAL</Text>
            <Text style={styles.cell}>DATA FINAL</Text>
            <Text style={styles.cell}>GARANTIA</Text>
            <Text style={styles.cell}>VENCIMENTO DA GARANTIA</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cell}>{data.serviceOrder.status}</Text>
            <Text style={styles.cell}>{data.serviceOrder.startDate}</Text>
            <Text style={styles.cell}>{data.serviceOrder.endDate}</Text>
            <Text style={styles.cell}>{data.serviceOrder.warrantyPeriod}</Text>
            <Text style={styles.cell}>{data.serviceOrder.warrantyExpiration}</Text>
          </View>
        </View>

        {/* Dados do Cliente */}
        <View style={styles.section}>
          <Text style={styles.boldText}>Dados do Cliente</Text>
          <Text>Nome: {data.client.name}</Text>
          <Text>CPF: {data.client.cpf}</Text>
          <Text>Telefone: {data.client.phone}</Text>
          <Text>WhatsApp: {data.client.whatsapp}</Text>
          <Text>Endereço: {data.client.address}</Text>
        </View>

        {/* Dados do Equipamento */}
        <View style={styles.section}>
          <Text style={styles.boldText}>Dados do Equipamento</Text>
          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.cell}>Nº EQ</Text>
              <Text style={styles.cell}>Subcategoria</Text>
              <Text style={styles.cell}>Marca</Text>
              <Text style={styles.cell}>Modelo</Text>
              <Text style={styles.cell}>Cor</Text>
              <Text style={styles.cell}>IMEI</Text>
            </View>
            {data.equipment.map((item, index) => (
              <View style={styles.row} key={index}>
                <Text style={styles.cell}>{item.number}</Text>
                <Text style={styles.cell}>{item.subcategory}</Text>
                <Text style={styles.cell}>{item.brand}</Text>
                <Text style={styles.cell}>{item.model}</Text>
                <Text style={styles.cell}>{item.color}</Text>
                <Text style={styles.cell}>{item.imei}</Text>
              </View>
            ))}
          </View>
          <Text>Defeito: {data.equipmentIssue}</Text>
        </View>

        {/* Checklist */}
        <View style={styles.section}>
          <Text style={styles.boldText}>Checklist</Text>
          <Text>O Aparelho Liga e Possibilita Testes? {data.devicePower ? 'Sim' : 'Não'}</Text>
          {!data.devicePower && (
            <View>
              <Text>Todos os testes foram impossibilitados.</Text>
              <Text>Assinatura do Cliente: ______________________</Text>
            </View>
          )}
          <Text>Checklist Técnico:</Text>
          {data.checklist.map((item, index) => (
            <Text key={index}>{item}</Text>
          ))}
        </View>

        {/* Serviços Executados */}
        {data.services.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.boldText}>Serviços Executados</Text>
            <View style={styles.table}>
              <View style={styles.row}>
                <Text style={styles.cell}>SERVIÇO</Text>
                <Text style={styles.cell}>QTD</Text>
                <Text style={styles.cell}>UND</Text>
                <Text style={styles.cell}>SUBTOTAL</Text>
              </View>
              {data.services.map((service, index) => (
                <View style={styles.row} key={index}>
                  <Text style={styles.cell}>{service.description}</Text>
                  <Text style={styles.cell}>{service.quantity}</Text>
                  <Text style={styles.cell}>{service.unit}</Text>
                  <Text style={styles.cell}>{service.subtotal}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Produtos Utilizados */}
        {data.products.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.boldText}>Produtos Utilizados</Text>
            <View style={styles.table}>
              <View style={styles.row}>
                <Text style={styles.cell}>PRODUTO</Text>
                <Text style={styles.cell}>QTD</Text>
                <Text style={styles.cell}>UND</Text>
                <Text style={styles.cell}>SUBTOTAL</Text>
              </View>
              {data.products.map((product, index) => (
                <View style={styles.row} key={index}>
                  <Text style={styles.cell}>{product.name}</Text>
                  <Text style={styles.cell}>{product.quantity}</Text>
                  <Text style={styles.cell}>{product.unit}</Text>
                  <Text style={styles.cell}>{product.subtotal}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Total Geral */}
        <View style={styles.section}>
          <Text style={styles.boldText}>TOTAL SERVIÇOS: R$ {data.totalServices}</Text>
          <Text style={styles.boldText}>TOTAL PRODUTOS: R$ {data.totalProducts}</Text>
          <Text style={styles.boldText}>TOTAL GERAL: R$ {data.total}</Text>
        </View>

        {/* Parecer Técnico */}
        <View style={styles.section}>
          <Text style={styles.boldText}>Parecer Técnico</Text>
          <Text>{data.technicalFeedback}</Text>
        </View>

        {/* Assinaturas */}
        <View style={styles.section}>
          <Text>Data: ___________</Text>
          <Text>Assinatura do Cliente: ______________________</Text>
          <Text>Assinatura do Técnico: ______________________</Text>
        </View>

        {/* Declaração Final do Cliente */}
        <View style={styles.section}>
          <Text>Eu, ______________________________________________, declaro que retirei o aparelho e realizei todos os testes necessários, constatando que o serviço foi ( ) Realizado | ( ) Não Realizado.</Text>
          <Text>O aparelho encontra-se em ( ) Perfeito estado de funcionamento | ( ) Mesmo problema identificado.</Text>
          <Text>Data da retirada do aparelho: //__.</Text>
          <Text>Assinatura do Cliente: ______________________</Text>
        </View>
      </Page>
    </Document>
  );
};

export default OSReport;
