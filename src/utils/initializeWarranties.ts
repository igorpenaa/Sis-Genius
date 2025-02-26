import { collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { DEFAULT_WARRANTIES } from '../types/warranty';

export async function initializeDefaultWarranties() {
  try {
    // Check if default warranties exist
    const warrantiesRef = collection(db, 'warranties');
    const q = query(warrantiesRef, where('isDefault', '==', true));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Add default warranties
      for (const warranty of DEFAULT_WARRANTIES) {
        const warrantyRef = doc(collection(db, 'warranties'));
        await setDoc(warrantyRef, {
          ...warranty,
          id: warrantyRef.id,
          description: `A Empresa compromete-se com a garantia de ${warranty.durationDays} dias para a prestação de serviço de manutenção para o CLIENTE, conforme especificada na Ordem de Serviço (O.S.): IDENTIFICAÇÃO DA O.S., com a finalidade de restabelecer as funcionalidades do MARCA, MODELO, IMEI conforme serviços: SERVIÇOS.`,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      console.log('Default warranties initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing default warranties:', error);
  }
}
