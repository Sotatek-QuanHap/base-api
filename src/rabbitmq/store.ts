import { ConfigService } from '@nestjs/config';
import * as client from 'amqplib';
import { Channel, Connection } from 'amqplib';
import { TimeUtils } from 'src/share/utils/time.utils';

export class Store {
  private static connection: Connection;
  private static config: ConfigService;
  private static uri: string;
  private static channels = new Map<string, Channel>();
  private static isRequestConnected = false;
  private static exchanges = new Map<string, Channel>();

  static async sendToQueue(
    queue: string,
    message: Buffer,
    config: ConfigService,
    priority = 0,
  ) {
    console.log('sendToQueue: ', queue);
    const channelTransactionUpdated = await this.getChannel(queue, config);
    channelTransactionUpdated.sendToQueue(queue, message, { priority });
  }

  static async publishToQueue(
    queue: string,
    message: Buffer,
    config: ConfigService,
  ) {
    const channelTransactionUpdated = await this.getExchange(queue, config);
    channelTransactionUpdated.publish(queue, '', message);
  }

  static async initRabbitMQ(config: ConfigService): Promise<void> {
    this.config = config;
    const rabbitmq_uri = this.config.get<string>(
      'RABBITMQ_URI',
      'amqp://admin:admin@localhost:5672',
    );
    this.uri = rabbitmq_uri;
    await this.connect();
  }

  static async connect(): Promise<void> {
    if (this.isRequestConnected) {
      console.log('is requested');
      return;
    }
    if (!this.connection) {
      this.isRequestConnected = true;
      try {
        this.connection = await client.connect(this.uri);
      } catch (error) {
        this.connection = undefined;
        console.log('connect has error, need reconnect', error);
        this.isRequestConnected = false;
        await TimeUtils.sleepRandom();
        await Store.connect();
        return;
      }
      this.connection.on('error', (err) => {
        console.log('Connection error', err);
      });
      this.connection.on('close', async () => {
        console.log('Connection close');
        this.connection = undefined;
        this.channels = new Map<string, Channel>();
        this.exchanges = new Map<string, Channel>();
        this.isRequestConnected = false;
      });
    }
  }

  static async getChannel(
    queueName: string,
    configService: ConfigService,
  ): Promise<Channel> {
    if (!this.connection) {
      await this.initRabbitMQ(configService);
    }
    while (!this.channels[queueName]) {
      while (!this.connection) {
        await TimeUtils.sleep(3000);
      }
      try {
        const channel = await this.connection.createChannel();
        await channel.assertQueue(queueName, {
          durable: true,
          maxPriority: 10,
        });
        this.channels[queueName] = channel;
        break;
      } catch (error) {
        await TimeUtils.sleep(3000);
      }
    }
    return this.channels[queueName];
  }

  static async getExchange(
    queueName: string,
    configService: ConfigService,
  ): Promise<Channel> {
    if (!this.connection) {
      await this.initRabbitMQ(configService);
    }
    while (!this.exchanges[queueName]) {
      while (!this.connection) {
        await TimeUtils.sleep(3000);
      }
      try {
        const channel = await this.connection.createChannel();
        await channel.assertExchange(queueName, 'fanout', {
          durable: false,
        });
        this.exchanges[queueName] = channel;
        break;
      } catch (error) {
        await TimeUtils.sleep(3000);
      }
    }
    return this.exchanges[queueName];
  }
  static removeQueue(queueName: string) {
    this.channels.delete(queueName);
    this.exchanges.delete(queueName);
    console.log('removeQueue', !!this.channels[queueName]);
  }
}
