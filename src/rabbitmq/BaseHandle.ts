import { Channel, ConsumeMessage } from 'amqplib';
import { ConfigService } from '@nestjs/config';
import { Store } from './store';
import { TimeUtils } from 'src/share/utils/time.utils';

export abstract class BaseHandle {
  protected name: string;
  protected channel: Channel;
  protected queueName: string;
  protected numberMessageLimit = 0;
  protected configService: ConfigService;
  constructor(configService: ConfigService) {
    this.configService = configService;
  }

  async loadChannel() {
    this.channel = await Store.getChannel(this.queueName, this.configService);
  }

  getNumberMessageLimit(): number {
    const key = this.name || this.queueName;
    this.numberMessageLimit = +this.configService.get(
      `number_message_of_${key}`.toLowerCase(),
      '1',
    );
    // console.log('getNumberMessageLimit of ' + key, this.numberMessageLimit);
    return this.numberMessageLimit;
  }

  async customerListen() {
    this.channel.prefetch(this.getNumberMessageLimit(), false);
    this.channel.consume(
      this.queueName,
      (msg) => {
        this.handle(msg, this);
      },
      { noAck: false },
    );
  }

  async listen(): Promise<void> {
    await this.loadChannel();
    this.channel.on('error', () => {
      Store.removeQueue(this.queueName);
      console.log('Channel error');
      try {
        this.channel.close();
      } catch (error) {}
    });
    this.channel.on('close', async () => {
      Store.removeQueue(this.queueName);
      console.log('Channel close');
      await TimeUtils.sleepRandom();
      try {
        this.listen();
      } catch (error) {}
    });
    try {
      await this.customerListen();
    } catch (error) {
      console.log('assert queue at exchange', error);
    }
  }

  async handle(message: ConsumeMessage, self: BaseHandle): Promise<void> {
    const msg = await self.parse(message);
    if (msg == null) {
      return;
    }
    try {
      await self.process(msg);
      await self.handleSuccess(msg, message, self);
    } catch (error) {
      self.handleError(msg, message, self, error);
    }
  }

  async parse(message: ConsumeMessage): Promise<any> {
    try {
      return JSON.parse(message.content.toString());
    } catch (error) {
      //send to parse json error
      const channel = await Store.getChannel(
        'parse-json-error',
        this.configService,
      );
      channel.sendToQueue('parse-json-error', message.content);
      this.channel.ack(message);
      return null;
    }
  }

  abstract process(message: any): Promise<void>;
  async handleError(
    msg: any,
    message: ConsumeMessage,
    self: BaseHandle,
    error: any,
  ) {
    console.log('has error, ', error);
    try {
      await Store.sendToQueue(
        msg.queueCallbackName,
        Buffer.from(
          JSON.stringify({
            _id: msg._id,
            status: 2,
            message: error.message || error,
          }),
        ),
        this.configService,
      );
    } catch (error) {}
    // self.channel.cancel(message.fields.consumerTag)
    self.channel.ack(message);
  }

  async handleSuccess(msg: any, message: ConsumeMessage, self: BaseHandle) {
    try {
      await Store.sendToQueue(
        msg.queueCallbackName,
        Buffer.from(
          JSON.stringify({
            _id: msg._id,
            status: 3,
          }),
        ),
        this.configService,
      );
    } catch (error) {}
    try {
      self.channel.ack(message);
    } catch (error) {}
  }
}
