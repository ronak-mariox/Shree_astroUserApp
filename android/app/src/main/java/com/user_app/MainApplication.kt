package com.user_app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    createDefaultNotificationChannel()
    loadReactNative(this)
  }

  /**
   * The channel every push lands in ("default" — the id the server sends and the manifest names
   * as FCM's fallback). Android 8+ drops a notification whose channel does not exist, and nothing
   * on the JS side can create one, so it is made here, before any message can arrive. Creating a
   * channel that already exists is a no-op, and keeps whatever the user changed in Settings.
   */
  private fun createDefaultNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    val channel = NotificationChannel("default", "General", NotificationManager.IMPORTANCE_HIGH)
    getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
  }
}
