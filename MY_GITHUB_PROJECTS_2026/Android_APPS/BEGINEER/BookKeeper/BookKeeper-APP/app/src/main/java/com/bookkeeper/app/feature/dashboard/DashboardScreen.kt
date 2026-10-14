/* DASHBOARD SCREEN: Shows balance, income, expenses, and recent transactions. */
package com.bookkeeper.app.feature.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Remove
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.bookkeeper.app.core.theme.*
import com.bookkeeper.app.core.util.formatCents
import com.bookkeeper.app.core.util.formatDate
import com.bookkeeper.app.domain.model.BookkeepingTransaction
import com.bookkeeper.app.domain.model.TransactionType

@Composable
fun DashboardScreen(viewModel: DashboardViewModel, onAddTransaction: () -> Unit) {
    val transactions by viewModel.transactions.collectAsStateWithLifecycle()
    val summary by viewModel.summary.collectAsStateWithLifecycle()

    LazyColumn(
        modifier = Modifier.fillMaxSize().background(BookKeeperPage),
        contentPadding = PaddingValues(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text("Good morning", style = MaterialTheme.typography.labelLarge, color = BookKeeperTeal)
            Text("Your money, in focus.", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(4.dp))
            Text("A clear view of what came in and what went out.", color = Color.Gray)
        }
        item {
            Card(colors = CardDefaults.cardColors(containerColor = BookKeeperNavy), shape = RoundedCornerShape(20.dp)) {
                Column(Modifier.padding(22.dp)) {
                    Text("CURRENT BALANCE", color = Color(0xFFB6CBD0), style = MaterialTheme.typography.labelSmall)
                    Text(formatCents(summary.balanceCents), color = Color.White, style = MaterialTheme.typography.displaySmall, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(18.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(24.dp)) {
                        SummaryMetric("Income", formatCents(summary.incomeCents), BookKeeperMint)
                        SummaryMetric("Expenses", formatCents(summary.expenseCents), BookKeeperCoral)
                    }
                }
            }
        }
        item {
            Button(onClick = onAddTransaction, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.Outlined.Add, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text("Add transaction")
            }
        }
        item { Text("Recent transactions", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold) }
        if (transactions.isEmpty()) {
            item { EmptyCard("No transactions yet", "Add your first income or expense to start the ledger.") }
        } else {
            items(transactions.take(8), key = { it.id }) { TransactionRow(it) }
        }
    }
}

@Composable
private fun SummaryMetric(label: String, value: String, color: Color) {
    Column {
        Text(label, color = Color(0xFFB6CBD0), style = MaterialTheme.typography.labelSmall)
        Text(value, color = color, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun TransactionRow(item: BookkeepingTransaction) {
    val income = item.type == TransactionType.INCOME
    ListItem(
        headlineContent = { Text(item.description, fontWeight = FontWeight.SemiBold) },
        supportingContent = { Text("${formatDate(item.transactionDate)} · ${item.type.name.lowercase().replaceFirstChar { it.uppercase() }}") },
        leadingContent = {
            Icon(if (income) Icons.Outlined.Add else Icons.Outlined.Remove, contentDescription = null, tint = if (income) BookKeeperTeal else BookKeeperCoral)
        },
        trailingContent = { Text(if (income) "+${formatCents(item.amountCents)}" else "-${formatCents(item.amountCents)}", color = if (income) BookKeeperTeal else BookKeeperCoral, fontWeight = FontWeight.Bold) },
        colors = ListItemDefaults.colors(containerColor = Color.White)
    )
}

@Composable
private fun EmptyCard(title: String, message: String) {
    Card(colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Column(Modifier.padding(20.dp)) { Text(title, fontWeight = FontWeight.Bold); Text(message, color = Color.Gray) }
    }
}
