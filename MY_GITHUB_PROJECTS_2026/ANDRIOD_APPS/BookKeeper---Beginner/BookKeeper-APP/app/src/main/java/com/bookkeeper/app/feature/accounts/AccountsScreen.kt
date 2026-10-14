/* ACCOUNTS SCREEN: Displays active cash, bank, wallet, and custom accounts. */
package com.bookkeeper.app.feature.accounts

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.bookkeeper.app.core.util.formatCents
import com.bookkeeper.app.domain.repository.AccountRepository

@Composable
fun AccountsScreen(repository: AccountRepository) {
    val accounts by repository.observeActive().collectAsStateWithLifecycle(emptyList())
    LazyColumn(Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { Text("Accounts", style = MaterialTheme.typography.headlineMedium); Text("Where your money lives.") }
        items(accounts, key = { it.id }) { account ->
            Card(Modifier.fillMaxWidth()) {
                ListItem(
                    headlineContent = { Text(account.name) },
                    supportingContent = { Text(account.accountType) },
                    trailingContent = { Text(formatCents(account.openingBalanceCents), fontWeight = androidx.compose.ui.text.font.FontWeight.Bold) }
                )
            }
        }
        if (accounts.isEmpty()) item { Text("No accounts yet.") }
    }
}
