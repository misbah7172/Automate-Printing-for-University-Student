package com.uni.printapp.firebase

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.uni.printapp.MainActivity
import com.uni.printapp.R

class MyFirebaseMessagingService : FirebaseMessagingService() {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        // Handle FCM messages here
        remoteMessage.data.isNotEmpty().let {
            // Handle data payload
            handleDataMessage(remoteMessage.data)
        }

        // Handle notification payload
        remoteMessage.notification?.let {
            sendNotification(it.title, it.body)
        }
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        
        // Send the new token to your server
        sendTokenToServer(token)
    }

    private fun handleDataMessage(data: Map<String, String>) {
        // Process data messages for print job updates, queue status, etc.
        val type = data["type"]
        val jobId = data["jobId"]
        val status = data["status"]
        
        when (type) {
            "job_completed" -> {
                sendNotification(
                    "Print Job Completed", 
                    "Your document has been printed successfully!"
                )
            }
            "job_failed" -> {
                sendNotification(
                    "Print Job Failed", 
                    "There was an error printing your document."
                )
            }
            "payment_required" -> {
                sendNotification(
                    "Payment Required", 
                    "Please add funds to your account to continue printing."
                )
            }
        }
    }

    private fun sendTokenToServer(token: String) {
        // TODO: Implement token sending to your backend server
        // This should update the user's FCM token in your database
    }

    private fun sendNotification(title: String?, messageBody: String?) {
        val intent = Intent(this, MainActivity::class.java)
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        
        val requestCode = 0
        val pendingIntent = PendingIntent.getActivity(
            this, requestCode, intent,
            PendingIntent.FLAG_IMMUTABLE
        )

        val channelId = "default_notification_channel"
        val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
        
        val notificationBuilder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.ic_stat_notification)
            .setContentTitle(title)
            .setContentText(messageBody)
            .setAutoCancel(true)
            .setSound(defaultSoundUri)
            .setContentIntent(pendingIntent)

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // For Android Oreo and above, create notification channel
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "AutoPrint Notifications",
                NotificationManager.IMPORTANCE_DEFAULT
            )
            notificationManager.createNotificationChannel(channel)
        }

        val notificationId = 0
        notificationManager.notify(notificationId, notificationBuilder.build())
    }
}