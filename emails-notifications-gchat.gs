// ** Google Chat - VIP group e-mails notifier **
// By: Jacob Farkas
// Modified on January 29, 2024
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

  // - Finds threads with the "vip-notify" label.
  // - Stored the results in the vipThreads array.
    const vipThreads = GmailApp.search('label:vip-notify');

  // Check if current time falls within office hours
  // Modify these parameters as you'd like
  const currentTime = Utilities.formatDate(new Date(), 'America/New_York', 'HH:mm');
  const isOfficeHours = (
    (currentTime >= '07:00' && currentTime < '19:00') && // From 7am to 7pm
    (new Date().getDay() !== 0 && new Date().getDay() !== 6) // Not Saturday or Sunday
  );

  // Proceed if within office hours, otherwise skip
  if (isOfficeHours) {
    
    // Sends Notification (if applicable)
    // Each function below will be used to build the body of the notification text
    if (vipThreads.length > 0) {
      
      // Iterates through each VIP thread
      for (const thread of vipThreads) {
         // - Accesses the message object within the thread.
      const message = thread.getMessages()[0];

      // - Extracts the sender name and subject from the message.
      // - Retrieves the sender's full name and ignores their email address
        const senderName = message.getFrom().split("<")[0];

      // - Retrieves Subject
        const subject = message.getSubject();

      // - Retrieves unique message ID
        const messageId = message.getId();
      
      // - Body of the notification message with sender's name, subject, and timestamp, and a link to the e-mail.
        const notificationMessage = `From: ${senderName}\nSubject: ${subject}\n\n --Sent on--\n${new Date().toLocaleTimeString()}\n\n[View Email](https://mail.google.com/mail/u/0/#inbox/${messageId})`;

      // - Sends the notification message to the chat space using UrlFetchApp.fetch.
          UrlFetchApp.fetch(spacesUrl, {
          'method': 'post',
          'payload': JSON.stringify({ text: notificationMessage }),
          'contentType': 'application/json'
        });

      // - Removes the "vip-notify" label from the processed thread.
        thread.removeLabel(GmailApp.getUserLabelByName('vip-notify'));
      }
    }
  } else {
    console.log('Skipping notification as it is outside office hours.');
  }

  // Return Responses (useful for testing the webapp in Google Apps Script when running manually)
  if (vipThreads.length > 0) {
    return HtmlService.createHtmlOutput(`<p>VIP email notifications sent successfully!</p>`);
  } else {
    return HtmlService.createHtmlOutput(`<p>No new VIP emails found.</p>`);
  }
}

