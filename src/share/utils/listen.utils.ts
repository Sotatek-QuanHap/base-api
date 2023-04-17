import { ITrigger } from '../common/trigger.base';

export enum ListenTypes {
  CURRENCY_CREATED,
  CURRENCY_UPDATED,
}

export class ListenUtils {
  private static triggles: Map<string, Map<string, ITrigger>> = new Map<
    string,
    Map<string, ITrigger>
  >();
  public static register(type: ListenTypes, key: string, triggle: ITrigger) {
    const event = type.toString();
    console.log('register', type, event);
    if (!this.triggles[event]) {
      this.triggles[event] = new Map<string, ITrigger>();
    }
    this.triggles[event][key] = triggle;
    this.triggles[event].push(triggle);
  }

  public static perform(event: ListenTypes, data: any) {
    if (this.triggles[event]) {
      for (const key in this.triggles[event]) {
        const triggle = this.triggles[event][key];
        triggle.perform(event, data);
      }
    }
  }
}
