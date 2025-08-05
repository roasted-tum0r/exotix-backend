import pino from 'pino';
import PinoPretty from 'pino-pretty';

export class AppLogger {
 private static logger = pino(
    {
      level: 'info',
      formatters: {
        level(label) {
          return { level: label.toUpperCase() };
        },
      },
    },
    PinoPretty({
      colorize: true,
      translateTime: 'UTC+5.5:yyyy-mm-dd HH:MM:ss.l',
      ignore: 'pid,hostname',
      messageFormat: (log, messageKey, levelLabel) => {
        return `${levelLabel.toUpperCase()} [${log.context || 'APP'}] ${log[messageKey]}`;
      },
    })
  );

  static log(...args: any[]) {
    this.logger.info(this.formatArgs(args));
  }

  static error(...args: any[]) {
    this.logger.error(this.formatArgs(args));
  }

  static warn(...args: any[]) {
    this.logger.warn(this.formatArgs(args));
  }

  static debug(...args: any[]) {
    this.logger.debug(this.formatArgs(args));
  }

  private static formatArgs(args: any[]) {
    return args.length === 1 ? args[0] : args;
  }
}
