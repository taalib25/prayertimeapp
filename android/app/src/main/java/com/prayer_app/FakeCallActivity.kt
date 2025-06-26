package com.prayer_app

import android.os.Bundle
import android.view.WindowManager
import android.content.Intent
import android.util.Log
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultReactActivityDelegate

class FakeCallActivity : ReactActivity() {

    override fun getMainComponentName(): String = "FakeCallScreen"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        Log.d("FakeCallActivity", "onCreate called")

        // These flags are important to show the activity over the lock screen and turn the screen on
        window.addFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        )
        
        // Handle the intent that launched this activity
        handleNotificationIntent(intent)
    }
    
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        Log.d("FakeCallActivity", "onNewIntent called")
        handleNotificationIntent(intent)
    }
    
    private fun handleNotificationIntent(intent: Intent) {
        try {
            val action = intent.action
            val data = intent.data
            
            Log.d("FakeCallActivity", "Intent action: $action")
            Log.d("FakeCallActivity", "Intent data: $data")
            
            // Log all extras
            val extras = intent.extras
            if (extras != null) {
                for (key in extras.keySet()) {
                    Log.d("FakeCallActivity", "Intent extra - $key: ${extras.get(key)}")
                }
            }
        } catch (e: Exception) {
            Log.e("FakeCallActivity", "Error handling notification intent", e)
        }
    }

    override fun createReactActivityDelegate(): ReactActivityDelegate {
        return DefaultReactActivityDelegate(
            this,
            mainComponentName,
            false // Disable new architecture for now
        )
    }

    override fun onBackPressed() {
        // Override back button to make it harder to dismiss accidentally
        Log.d("FakeCallActivity", "Back button pressed")
        finishAndRemoveTask()
    }
    
    override fun onDestroy() {
        Log.d("FakeCallActivity", "onDestroy called")
        super.onDestroy()
    }
}
