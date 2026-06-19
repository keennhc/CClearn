import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { CommunityMessage } from '@home-owners-hub/shared-types';

@WebSocketGateway({ cors: { origin: '*' } })
export class CommunityGateway {
  @WebSocketServer()
  server: { to: (room: string) => { emit: (event: string, data: unknown) => void }; emit: (event: string, data: unknown) => void };

  @SubscribeMessage('join')
  handleJoin(client: { join: (room: string) => void }, room: string) {
    client.join(room);
  }

  @SubscribeMessage('leave')
  handleLeave(client: { leave: (room: string) => void }, room: string) {
    client.leave(room);
  }

  broadcastMessage(communityId: string, message: CommunityMessage) {
    this.server.to(`community:${communityId}`).emit('new-message', message);
  }
}
