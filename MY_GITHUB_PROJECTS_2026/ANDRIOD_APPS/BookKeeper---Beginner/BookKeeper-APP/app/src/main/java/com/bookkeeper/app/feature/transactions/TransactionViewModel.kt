/* TRANSACTION VIEWMODEL: Owns transaction list state and add/delete actions. */
package com.bookkeeper.app.feature.transactions

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.bookkeeper.app.domain.model.BookkeepingTransaction
import com.bookkeeper.app.domain.repository.AccountRepository
import com.bookkeeper.app.domain.repository.CategoryRepository
import com.bookkeeper.app.domain.repository.TransactionRepository
import com.bookkeeper.app.domain.usecase.AddTransactionUseCase
import com.bookkeeper.app.domain.usecase.DeleteTransactionUseCase
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class TransactionViewModel(
    private val repository: TransactionRepository,
    val accountRepository: AccountRepository,
    val categoryRepository: CategoryRepository,
    private val addTransaction: AddTransactionUseCase,
    private val deleteTransaction: DeleteTransactionUseCase
) : ViewModel() {
    val transactions: StateFlow<List<BookkeepingTransaction>> = repository.observeAll()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    fun add(item: BookkeepingTransaction, onError: (String) -> Unit) = viewModelScope.launch {
        runCatching { addTransaction(item) }.onFailure { onError(it.message ?: "Could not save transaction.") }
    }

    fun delete(item: BookkeepingTransaction) = viewModelScope.launch { deleteTransaction(item) }
}

class TransactionViewModelFactory(
    private val repository: TransactionRepository,
    private val accountRepository: AccountRepository,
    private val categoryRepository: CategoryRepository,
    private val addTransaction: AddTransactionUseCase,
    private val deleteTransaction: DeleteTransactionUseCase
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T = TransactionViewModel(repository, accountRepository, categoryRepository, addTransaction, deleteTransaction) as T
}
