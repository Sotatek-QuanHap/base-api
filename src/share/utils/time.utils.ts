export class TimeUtils {
  static sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  static sleepRandom({ range = 3000, min = 5000 } = {}) {
    return new Promise((resolve) => {
      setTimeout(resolve, Math.round(Math.random() * range + min));
    });
  }
}
