export class Logger {
  /**
   * Log an informational message
   */
  static log(message: string): void {
    console.log(`\tℹ️ ${message}`);
  }

  /**
   * Log a success message
   */
  static ok(message: string): void {
    console.log(`\t✅ ${message}`);
  }

  /**
   * Log a warning message
   */
  static warn(message: string): void {
    console.error(`\t⚠️ ${message}`);
  }

  /**
   * Log an error message
   */
  static error(message: string): void {
    console.error(`\t❌ ${message}`);
  }

  static debug(message: string): void {
    console.debug(`\t🐞 ${message}`);
  }

  /**
   * Log a section header
   */
  static section(title: string): void {
    console.error('');
    console.error(
      '✨🔖✨================================================✨🔖✨',
    );
    console.error(title);
    console.error(
      '✨🔖✨================================================✨🔖✨',
    );
    console.error('');
  }
}
