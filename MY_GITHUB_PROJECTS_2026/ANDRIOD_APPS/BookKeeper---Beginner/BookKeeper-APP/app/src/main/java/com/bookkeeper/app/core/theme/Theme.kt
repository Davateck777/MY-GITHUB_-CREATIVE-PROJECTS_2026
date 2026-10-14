/* COMPOSE THEME: Applies Material 3 colors and typography to the whole app. */
package com.bookkeeper.app.core.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable

private val LightColors = lightColorScheme(
    primary = BookKeeperTeal,
    onPrimary = androidx.compose.ui.graphics.Color.White,
    secondary = BookKeeperNavy,
    background = BookKeeperPage,
    surface = androidx.compose.ui.graphics.Color.White,
    error = BookKeeperCoral
)

@Composable
fun BookKeeperTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = LightColors, content = content)
}
