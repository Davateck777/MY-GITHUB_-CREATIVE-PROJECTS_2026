/* TRANSACTION FORM: Collects a validated income or expense record and saves it through the ViewModel. */
package com.bookkeeper.app.feature.transactions

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.bookkeeper.app.domain.model.BookkeepingTransaction
import com.bookkeeper.app.domain.model.TransactionType
import java.time.LocalDate

@Composable
fun TransactionFormScreen(viewModel: TransactionViewModel, onSaved: () -> Unit, onCancel: () -> Unit) {
    val accounts by viewModel.accountRepository.observeActive().collectAsStateWithLifecycle(emptyList())
    val categories by viewModel.categoryRepository.observeAll().collectAsStateWithLifecycle(emptyList())
    var type by rememberSaveable { mutableStateOf(TransactionType.EXPENSE) }
    var amount by rememberSaveable { mutableStateOf("") }
    var description by rememberSaveable { mutableStateOf("") }
    var notes by rememberSaveable { mutableStateOf("") }
    var accountId by rememberSaveable { mutableLongStateOf(0L) }
    var categoryId by rememberSaveable { mutableLongStateOf(0L) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(accounts, categories, type) {
        if (accountId == 0L) accountId = accounts.firstOrNull()?.id ?: 0L
        if (categoryId == 0L) categoryId = categories.firstOrNull { it.type == type }?.id ?: 0L
    }

    Column(Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text("New transaction", style = MaterialTheme.typography.headlineMedium)
        SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth()) {
            SegmentedButton(type == TransactionType.EXPENSE, onClick = { type = TransactionType.EXPENSE; categoryId = categories.firstOrNull { it.type == TransactionType.EXPENSE }?.id ?: 0L }, shape = SegmentedButtonDefaults.itemShape(0, 2)) { Text("Expense") }
            SegmentedButton(type == TransactionType.INCOME, onClick = { type = TransactionType.INCOME; categoryId = categories.firstOrNull { it.type == TransactionType.INCOME }?.id ?: 0L }, shape = SegmentedButtonDefaults.itemShape(1, 2)) { Text("Income") }
        }
        OutlinedTextField(amount, { amount = it }, Modifier.fillMaxWidth(), label = { Text("Amount") }, singleLine = true)
        OutlinedTextField(description, { description = it }, Modifier.fillMaxWidth(), label = { Text("Description") }, singleLine = true)
        OutlinedTextField(notes, { notes = it }, Modifier.fillMaxWidth(), label = { Text("Notes (optional)") }, minLines = 2)
        Text("Account: ${accounts.firstOrNull { it.id == accountId }?.name ?: "Loading…"}", style = MaterialTheme.typography.bodyMedium)
        Text("Category: ${categories.firstOrNull { it.id == categoryId }?.name ?: "Loading…"}", style = MaterialTheme.typography.bodyMedium)
        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        Spacer(Modifier.weight(1f))
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            OutlinedButton(onClick = onCancel, Modifier.weight(1f)) { Text("Cancel") }
            Button(onClick = {
                val cents = ((amount.toDoubleOrNull() ?: 0.0) * 100).toLong()
                val item = BookkeepingTransaction(0, accountId, categoryId, type, cents, "USD", description, LocalDate.now().toString(), notes)
                viewModel.add(item) { error = it }
                if (cents > 0 && description.isNotBlank()) onSaved()
            }, Modifier.weight(1f)) { Text("Save") }
        }
    }
}
