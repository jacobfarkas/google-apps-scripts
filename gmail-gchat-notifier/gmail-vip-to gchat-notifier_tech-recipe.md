### Tech Recipe - Gmail notifications sent to a Google Chat Space
Turn off Gmail Notifications! If you would like to still get notifications for e-mails sent from specific people, you can configure a Google Chat Space (Channel) to receive these messages. You could setup that Channel to allow notifications. This way, only the e-mails that match the criteria you select will notify the chat channel. As a result, fewer notifications!

You can also configure this script to post to your chat channel during certain times. By default, the script posts from Monday to Friday, 7AM to 7PM.

This document outlines the steps needed so that the script works.

The following are required:

In [Gmail](https://mail.google.com) you will need:
- Labels
- Mail Filters

#### Create Labels:
Under Gmail > Settings > Labels, create these 2 labels
**VIP**: This label will be used to identify important emails from specific senders.
**vip-notify**: This label will be used for emails from the same senders that require immediate attention.

#### Create Filters:
Setup a filter that looks for incoming messages from particular e-mail addresses and apply the **VIP** label

Setup a duplicate filter that does the same, but applies the **vip-notify** filter

In [Gchat](https://chat.google.com) you will need:
- Google Chat Spaces
- A Webhook address to post to the Google Chat Spaces

In [Google Apps Script](https://scripts.google.com) you will need:
- The email-notification-gchat script
- The webhook URL in Google Chat
- The gmail API

##### Frequency of script
Triggers > Add Trigger

Choose which function to run
**doGet**
Which runs at deployment
**Head**
Select event source
**Time-driven**
Select type of time based trigger
**Minutes Timer**
Select minute interval (Choose what you like, I choose:)
**Every Minute**
Failure notification settings
**Notify me daily**

