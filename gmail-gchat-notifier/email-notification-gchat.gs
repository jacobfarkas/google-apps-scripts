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
//   - See the full tech recipe here:
//   - https://github.com/jacobfarkas/google-apps-scripts/blob/main/gmail-vip-to%20gchat-notifier/gmail-vip-to%20gchat-notifier_tech-recipe.md

function doGet(e) {
  try {
    // Place your Webhook URL here, in between the single-quotes, leave the semicolon at end of line
    const spacesUrl = 'https://chat.googleapis.com/v1/spaces/AAAA3V0TPOo/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=cvvBwKfpVtcIFGfZ9hNRcfGnA8mHKS3MKURISQerDn4';
    
    // Find threads with the "vip-notify" label - with timeout/retry logic
    let vipThreads;
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        vipThreads = GmailApp.search('label:vip-notify', 0, 10); // Limit to 10 threads at a time
        break; // If successful, exit the loop
      } catch (searchError) {
        retries++;
        if (retries >= maxRetries) throw searchError;
        Utilities.sleep(1000 * retries); // Exponential backoff
      }
    }
    
    // Check if current time is within office hours (7am-7pm weekdays, ET)
    const now = new Date();
    const day = now.getDay();
    const currentTime = Utilities.formatDate(now, 'America/New_York', 'HH:mm');
    const isOfficeHours = (currentTime >= '07:00' && currentTime < '19:00') && (day !== 0 && day !== 6);
    
    let processedCount = 0;
    
    // Only proceed during office hours and if there are threads to process
    if (isOfficeHours && vipThreads && vipThreads.length > 0) {
      // Get the label outside the loop to reduce API calls
      const vipLabel = GmailApp.getUserLabelByName('vip-notify');
      
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
          while (!sendSuccess && sendRetries < 3) {
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
              if (sendRetries >= 3) {
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
            Utilities.sleep(200);
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
