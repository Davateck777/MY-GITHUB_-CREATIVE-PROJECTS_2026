/* SETTINGS SCREEN: Documents the local-first MVP and leaves room for security toggles. */
package com.bookkeeper.app.feature.settings

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun SettingsScreen() {
    var appLock by remember { mutableStateOf(false) }
    Column(Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("Settings", style = MaterialTheme.typography.headlineMedium)
        Text("Keep BookKeeper tailored to your workflow.")
        Card(Modifier.fillMaxWidth()) {
            ListItem(
                headlineContent = { Text("App lock") },
                supportingContent = { Text("Security integration is prepared for the MVP next step.") },
                trailingContent = { Switch(checked = appLock, onCheckedChange = { appLock = it }) }
            )
        }
        Card(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(16.dp)) {
                Text("Privacy", style = MaterialTheme.typography.titleMedium)
                Spacer(Modifier.height(6.dp))
                Text("BookKeeper stores MVP records locally on this device. Do not enter sensitive financial or personal information until the security model has been reviewed.")
            }
        }
    }
}
