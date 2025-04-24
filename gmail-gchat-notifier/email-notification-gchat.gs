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
  // Place your Webhook URL here, in between the single-quotes, leave the semicolon at end of line
  const spacesUrl = 'https://chat.googleapis.com/v1/spaces/AAAA3V0TPOo/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=cvvBwKfpVtcIFGfZ9hNRcfGnA8mHKS3MKURISQerDn4';
  
  // Find threads with the "vip-notify" label
  const vipThreads = GmailApp.search('label:vip-notify');
  const vipLabel = GmailApp.getUserLabelByName('vip-notify');
  
  // Check if current time is within office hours (7am-7pm weekdays, ET)
  const now = new Date();
  const day = now.getDay();
  const currentTime = Utilities.formatDate(now, 'America/New_York', 'HH:mm');
  const isOfficeHours = (currentTime >= '07:00' && currentTime < '19:00') && (day !== 0 && day !== 6);
  
  // Only proceed during office hours and if there are threads to process
  if (isOfficeHours && vipThreads.length > 0) {
    // Process each thread
    vipThreads.forEach(thread => {
      const message = thread.getMessages()[0];
      const senderName = message.getFrom().split("<")[0];
      const subject = message.getSubject();
      const messageId = message.getId();
      
      // Create notification message
      const notificationMessage = `From: ${senderName}\nSubject: ${subject}\n\n --Sent on--\n${now.toLocaleTimeString()}\n\n[View Email](https://mail.google.com/mail/u/0/#inbox/${messageId})`;
      
      // Send chat notification
      UrlFetchApp.fetch(spacesUrl, {
        'method': 'post',
        'payload': JSON.stringify({ text: notificationMessage }),
        'contentType': 'application/json'
      });
      
      // Remove label
      thread.removeLabel(vipLabel);
    });
  } else if (!isOfficeHours) {
    console.log('Skipping notification as it is outside office hours.');
  }
  
  // Return response (useful for testing the webapp in Google Apps Script when running manually)
  return HtmlService.createHtmlOutput(
    vipThreads.length > 0 ? 
    '<p>VIP email notifications sent successfully!</p>' : 
    '<p>No new VIP emails found.</p>'
  );
}
