import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { CommunityMessage } from '@home-owners-hub/shared-types';

@WebSocketGateway({ cors: { origin: '*' } })
export class CommunityGateway {
  @WebSocketServer()
  server: { emit: (event: string, data: unknown) => void };

  broadcastMessage(message: CommunityMessage) {
    this.server.emit('new-message', message);
  }
}
