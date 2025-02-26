import { doc, getDoc, setDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { db } from '../config/firebase';

const COUNTER_DOC = 'counters/service_order';
const INITIAL_NUMBER = 1;

interface Counter {
  currentValue: number;
  lastUpdated: Date;
}

// Initialize or get counter
export async function initializeCounter(): Promise<void> {
  const counterRef = doc(db, COUNTER_DOC);
  
  try {
    const counterDoc = await getDoc(counterRef);
    
    if (!counterDoc.exists()) {
      await setDoc(counterRef, {
        currentValue: INITIAL_NUMBER,
        lastUpdated: new Date()
      });
    }
  } catch (error) {
    console.error('Error initializing counter:', error);
    throw new Error('Falha ao inicializar contador de O.S.');
  }
}

// Get next number with retry logic
export async function getNextOrderNumber(retries = 3): Promise<string> {
  const counterRef = doc(db, COUNTER_DOC);
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const newNumber = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        
        if (!counterDoc.exists()) {
          await initializeCounter();
          return INITIAL_NUMBER;
        }
        
        const counter = counterDoc.data() as Counter;
        const nextNumber = counter.currentValue + 1;
        
        transaction.update(counterRef, {
          currentValue: nextNumber,
          lastUpdated: new Date()
        });
        
        return nextNumber;
      });

      // Format number with leading zeros
      return newNumber.toString().padStart(4, '0');
      
    } catch (error) {
      console.error(`Error generating number (attempt ${attempt + 1}):`, error);
      
      if (attempt === retries - 1) {
        throw new Error('Falha ao gerar número da O.S.');
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error('Falha ao gerar número da O.S.');
}