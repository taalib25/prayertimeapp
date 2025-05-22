package com.prayer_app

import android.os.Bundle
import android.view.WindowManager
import androidx.appcompat.app.AppCompatActivity
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class FakeCallActivity : ReactActivity() {

    override fun getMainComponentName(): String = "FakeCallScreen" // This should match the name you register in JS

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(null) // Use null for savedInstanceState if not using fabric

        // These flags are important to show the activity over the lock screen and turn the screen on
        window.addFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON
        )
    }

    // Optional: If you need to pass initial props to your React component
    // override fun createReactActivityDelegate(): ReactActivityDelegate {
    //     return DefaultReactActivityDelegate(
    //         this,
    //         mainComponentName,
    //         fabricEnabled
    //     )
    // }
}
