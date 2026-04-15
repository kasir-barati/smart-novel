import log from 'loglevel';

// Configure log level based on environment
// Development: show all logs (debug level)
// Production: show only warnings and errors
log.setLevel(import.meta.env.PROD ? 'warn' : 'debug');

export const logger = log;
