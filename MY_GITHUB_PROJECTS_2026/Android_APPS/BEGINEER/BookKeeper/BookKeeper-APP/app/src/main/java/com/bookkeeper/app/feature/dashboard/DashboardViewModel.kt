/* DASHBOARD VIEWMODEL: Exposes reactive transactions and computed summary values. */
package com.bookkeeper.app.feature.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.bookkeeper.app.domain.repository.TransactionRepository
import com.bookkeeper.app.domain.usecase.DashboardSummary
import com.bookkeeper.app.domain.usecase.GetDashboardSummaryUseCase
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn

class DashboardViewModel(
    repository: TransactionRepository,
    private val summaryUseCase: GetDashboardSummaryUseCase
) : ViewModel() {
    val transactions: StateFlow<List<com.bookkeeper.app.domain.model.BookkeepingTransaction>> = repository.observeAll()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val summary: StateFlow<DashboardSummary> = transactions
        .map(summaryUseCase::invoke)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), DashboardSummary(0, 0, 0))
}

class DashboardViewModelFactory(
    private val repository: TransactionRepository,
    private val summaryUseCase: GetDashboardSummaryUseCase
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T = DashboardViewModel(repository, summaryUseCase) as T
}
