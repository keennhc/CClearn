import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

// Isolated in its own class (rather than called directly from NotificationsService)
// purely so NotificationsService's tests can mock this one method instead of hitting the network.
@Injectable()
export class ExpoPushClient {
  private readonly logger = new Logger(ExpoPushClient.name);
  private readonly expo = new Expo();

  isValidToken(token: string): boolean {
    return Expo.isExpoPushToken(token);
  }

  async send(messages: ExpoPushMessage[]): Promise<void> {
    if (messages.length === 0) return;

    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        await this.expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        this.logger.error('Failed to send a push notification chunk', error as Error);
      }
    }
  }
}
