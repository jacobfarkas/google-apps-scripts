// Configuration settings for the VIP Email Notifier
const CONFIG = {
  // Google Chat webhook URL (USE ACTUAL WEBHOOK_URL.....)
  WEBHOOK_URL: 'https://chat.googleapis.com/nnnnnnnnnnnnnnnnnnnnn',
  
  // Other configuration settings if needed
  NOTIFY_LABEL: 'vip-notify',
  
  // Office hours configuration
  OFFICE_HOURS: {
    START_TIME: '07:00',
    END_TIME: '19:00',
    TIMEZONE: 'America/New_York',
    // Weekend days (0 = Sunday, 6 = Saturday)
    WEEKEND_DAYS: [0, 6]
  },
  
  // Retry settings
  MAX_RETRIES: 3,
  THREADS_PER_BATCH: 10,
  THREAD_PROCESSING_DELAY: 200  // milliseconds
};
