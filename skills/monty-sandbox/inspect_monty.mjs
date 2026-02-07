import { Monty } from '../../node_modules/@pydantic/monty/index.js';

console.log('Monty type:', typeof Monty);
console.log('Monty keys:', Object.keys(Monty));
console.log('Monty prototype keys:', Object.getOwnPropertyNames(Monty.prototype));
