import { initializeCounter } from './serviceOrderNumber';

// Initialize the counter
initializeCounter()
  .then(() => {
    console.log('Counter initialized successfully');
  })
  .catch((error) => {
    console.error('Error initializing counter:', error);
  });