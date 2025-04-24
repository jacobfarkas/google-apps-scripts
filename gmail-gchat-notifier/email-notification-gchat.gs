// ** Google Chat - VIP group e-mails notifier **
// By: Jacob Farkas
// Modified on April 24, 2025
//
// This script searches for Gmail threads with the label "vip-notify",
// sends a notification message to a specified chat space including sender name and subject,
// and removes the "vip-notify" label from processed threads.
//
// ** Assumptions **
//   - You have Gmail filters configured to add the "vip-notify" label to relevant messages.
//   - You created a Google Chat spaces location, and webhook, so you have where to post the notifications
//   - Configuration is stored in the separate "config.gs" file
//   - See the full tech recipe here:
//   - https://github.com/jacobfarkas/google-apps-scripts/blob/main/gmail-vip-to%20gchat-notifier/gmail-vip-to%20gchat-notifier_tech-recipe.md

function doGet(e) {
  try {
    // Get webhook URL from configuration file
    const spacesUrl = CONFIG.WEBHOOK_URL;
    
    // Find threads with the configured label - with timeout/retry logic
    let vipThreads;
    let retries = 0;
    
    while (retries < CONFIG.MAX_RETRIES) {
      try {
        vipThreads = GmailApp.search(`label:${CONFIG.NOTIFY_LABEL}`, 0, CONFIG.THREADS_PER_BATCH);
        break; // If successful, exit the loop
      } catch (searchError) {
        retries++;
        if (retries >= CONFIG.MAX_RETRIES) throw searchError;
        Utilities.sleep(1000 * retries); // Exponential backoff
      }
    }
    
    // Check if current time is within office hours
    const now = new Date();
    const day = now.getDay();
    const currentTime = Utilities.formatDate(now, CONFIG.OFFICE_HOURS.TIMEZONE, 'HH:mm');
    const isOfficeHours = (
      currentTime >= CONFIG.OFFICE_HOURS.START_TIME && 
      currentTime < CONFIG.OFFICE_HOURS.END_TIME && 
      !CONFIG.OFFICE_HOURS.WEEKEND_DAYS.includes(day)
    );
    
    let processedCount = 0;
    
    // Only proceed during office hours and if there are threads to process
    if (isOfficeHours && vipThreads && vipThreads.length > 0) {
      // Get the label outside the loop to reduce API calls
      const vipLabel = GmailApp.getUserLabelByName(CONFIG.NOTIFY_LABEL);
      
      // Process each thread
      for (let i = 0; i < vipThreads.length; i++) {
        try {
          const thread = vipThreads[i];
          const message = thread.getMessages()[0];
          const senderName = message.getFrom().split("<")[0];
          const subject = message.getSubject();
          const messageId = message.getId();
          
          // Create notification message
          const notificationMessage = `From: ${senderName}\nSubject: ${subject}\n\n --Sent on--\n${now.toLocaleTimeString()}\n\n[View Email](https://mail.google.com/mail/u/0/#inbox/${messageId})`;
          
          // Send chat notification with retry logic
          let sendSuccess = false;
          let sendRetries = 0;
          while (!sendSuccess && sendRetries < CONFIG.MAX_RETRIES) {
            try {
              UrlFetchApp.fetch(spacesUrl, {
                'method': 'post',
                'payload': JSON.stringify({ text: notificationMessage }),
                'contentType': 'application/json',
                'muteHttpExceptions': true,
                'timeout': 10000 // 10 second timeout
              });
              sendSuccess = true;
            } catch (fetchError) {
              sendRetries++;
              if (sendRetries >= CONFIG.MAX_RETRIES) {
                console.error("Failed to send notification after 3 attempts: " + fetchError);
                break;
              }
              Utilities.sleep(1000 * sendRetries);
            }
          }
          
          // Remove label only if notification was sent successfully
          if (sendSuccess) {
            thread.removeLabel(vipLabel);
            processedCount++;
          }
          
          // Add a pause between processing to avoid hitting rate limits
          if (i < vipThreads.length - 1) {
            Utilities.sleep(CONFIG.THREAD_PROCESSING_DELAY);
          }
        } catch (threadError) {
          console.error("Error processing thread: " + threadError);
          continue; // Skip to next thread if there's an error
        }
      }
    } else if (!isOfficeHours) {
      console.log('Skipping notification as it is outside office hours.');
    }
    
    // Return response (useful for testing the webapp in Google Apps Script when running manually)
    return HtmlService.createHtmlOutput(
      processedCount > 0 ? 
      `<p>VIP email notifications sent successfully! Processed ${processedCount} threads.</p>` : 
      '<p>No new VIP emails found or processed.</p>'
    );
  } catch (error) {
    console.error("Main function error: " + error);
    return HtmlService.createHtmlOutput(`<p>Error running script: ${error.toString()}</p>`);
  }
}
