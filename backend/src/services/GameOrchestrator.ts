import { EventEmitter } from 'events';
import { GameMove } from '../models/GameMove';

export class GameOrchestrator extends EventEmitter {
  handleGameMove(gameMove: GameMove): void {
    console.log('Handling game move:', gameMove);

  }
}
