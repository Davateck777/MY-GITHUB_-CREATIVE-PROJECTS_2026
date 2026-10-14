/* REPORTS SCREEN: Presents compact income, expense, and category summaries from the ledger. */
package com.bookkeeper.app.feature.reports

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.bookkeeper.app.core.util.formatCents
import com.bookkeeper.app.domain.repository.TransactionRepository
import com.bookkeeper.app.domain.usecase.GetCategoryTotalsUseCase
import com.bookkeeper.app.domain.usecase.GetDashboardSummaryUseCase

@Composable
fun ReportsScreen(repository: TransactionRepository) {
    val transactions by repository.observeAll().collectAsStateWithLifecycle(emptyList())
    val summary = GetDashboardSummaryUseCase()(transactions)
    val categoryTotals = GetCategoryTotalsUseCase()(transactions)
    LazyColumn(Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item { Text("Reports", style = MaterialTheme.typography.headlineMedium); Text("A simple view of your bookkeeping activity.") }
        item { ReportCard("Income", formatCents(summary.incomeCents)); ReportCard("Expenses", formatCents(summary.expenseCents)); ReportCard("Net cash flow", formatCents(summary.balanceCents)) }
        item { Text("Expense categories", style = MaterialTheme.typography.titleLarge) }
        item { if (categoryTotals.isEmpty()) Text("No expenses recorded yet.") else categoryTotals.entries.forEach { Text("Category #${it.key}: ${formatCents(it.value)}") } }
    }
}

@Composable
private fun ReportCard(label: String, value: String) {
    Card(Modifier.fillMaxWidth()) { ListItem(headlineContent = { Text(label) }, trailingContent = { Text(value, fontWeight = androidx.compose.ui.text.font.FontWeight.Bold) }) }
}
