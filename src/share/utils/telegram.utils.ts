import { ConfigService } from '@nestjs/config';

export class TelegramUtils {
  private static key: string;
  static loadConfig(config: ConfigService) {
    this.key = config.get('TELEGRAM_PRIVATE_KEY');
  }
  static async sendNormalText(groupId: string, title: string, message: string) {
    console.log('send normal text: ', groupId, title, message);
  }
}
