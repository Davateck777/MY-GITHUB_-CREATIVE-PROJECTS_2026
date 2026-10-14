/* TRANSACTION LIST: Shows the local ledger and links to the add transaction form. */
package com.bookkeeper.app.feature.transactions

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.bookkeeper.app.core.theme.BookKeeperPage
import com.bookkeeper.app.feature.dashboard.TransactionRow

@Composable
fun TransactionListScreen(viewModel: TransactionViewModel, onAdd: () -> Unit) {
    val transactions by viewModel.transactions.collectAsStateWithLifecycle()
    Column(Modifier.fillMaxSize().background(BookKeeperPage).padding(20.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Column { Text("Ledger", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold); Text("Every movement, accounted for.", color = Color.Gray) }
            Button(onClick = onAdd) { Text("Add") }
        }
        Spacer(Modifier.height(18.dp))
        if (transactions.isEmpty()) {
            Text("No transactions recorded yet.", color = Color.Gray)
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                items(transactions, key = { it.id }) { item ->
                    TransactionRow(item)
                }
            }
        }
    }
}
