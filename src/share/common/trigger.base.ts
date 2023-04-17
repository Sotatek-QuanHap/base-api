export interface ITrigger {
  perform(event: string, data: any): void;
}
