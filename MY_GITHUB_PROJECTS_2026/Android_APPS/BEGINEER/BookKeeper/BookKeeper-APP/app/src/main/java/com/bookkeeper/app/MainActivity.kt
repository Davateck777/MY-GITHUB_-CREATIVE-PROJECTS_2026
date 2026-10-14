/* MAIN ACTIVITY: Hosts the Compose content and injects the application container. */
package com.bookkeeper.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.bookkeeper.app.core.navigation.BookKeeperNavGraph
import com.bookkeeper.app.core.theme.BookKeeperTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val container = (application as BookKeeperApplication).container
        setContent { BookKeeperTheme { BookKeeperNavGraph(container) } }
    }
}
