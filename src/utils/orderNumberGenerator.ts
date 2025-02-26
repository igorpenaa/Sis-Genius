import { doc, getDoc, setDoc, updateDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';

const COUNTER_DOC_ID = 'service_order_counter';

interface Counter {
  currentNumber: number;
}

export async function getNextOrderNumber(): Promise<number> {
  const counterRef = doc(db, 'counters', COUNTER_DOC_ID);
  
  try {
    const counterDoc = await getDoc(counterRef);
    
    if (!counterDoc.exists()) {
      // Initialize counter if it doesn't exist
      await setDoc(counterRef, { currentNumber: 1 });
      return 1;
    }

    const counter = counterDoc.data() as Counter;
    const nextNumber = counter.currentNumber + 1;

    // Update counter
    await updateDoc(counterRef, {
      currentNumber: nextNumber
    });

    return nextNumber;
  } catch (error) {
    console.error('Error generating order number:', error);
    throw new Error('Não foi possível gerar o número da O.S.');
  }
}

export async function initializeExistingOrders() {
  const batch = writeBatch(db);
  const ordersRef = collection(db, 'serviceOrders');
  const counterRef = doc(db, 'counters', COUNTER_DOC_ID);
  
  try {
    // Get all orders that don't have an orderNumber
    const snapshot = await getDocs(ordersRef);
    let maxNumber = 0;
    const ordersToUpdate: { ref: any; createdAt: Date }[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      if (!data.orderNumber) {
        ordersToUpdate.push({
          ref: doc.ref,
          createdAt: data.createdAt?.toDate() || new Date()
        });
      } else if (data.orderNumber > maxNumber) {
        maxNumber = data.orderNumber;
      }
    });

    // Sort orders by creation date to maintain chronological order
    ordersToUpdate.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Assign numbers to orders without them
    ordersToUpdate.forEach((order, index) => {
      const orderNumber = maxNumber + index + 1;
      batch.update(order.ref, { orderNumber });
    });

    // Update counter to the highest number used
    const finalNumber = maxNumber + ordersToUpdate.length;
    await setDoc(counterRef, { currentNumber: finalNumber });

    // Commit all updates
    await batch.commit();
    
    console.log(`Initialized ${ordersToUpdate.length} orders with sequential numbers`);
    return ordersToUpdate.length;
  } catch (error) {
    console.error('Error initializing order numbers:', error);
    throw new Error('Erro ao inicializar números das O.S.');
  }
}
