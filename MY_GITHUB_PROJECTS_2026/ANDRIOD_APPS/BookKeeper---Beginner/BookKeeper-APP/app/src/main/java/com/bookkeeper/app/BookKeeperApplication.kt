/* APPLICATION CONTAINER: Creates Room, repositories, use cases, and default seed data. */
package com.bookkeeper.app

import android.app.Application
import com.bookkeeper.app.data.local.BookKeeperDatabase
import com.bookkeeper.app.data.repository.AccountRepositoryImpl
import com.bookkeeper.app.data.repository.CategoryRepositoryImpl
import com.bookkeeper.app.data.repository.TransactionRepositoryImpl
import com.bookkeeper.app.domain.model.Account
import com.bookkeeper.app.domain.model.Category
import com.bookkeeper.app.domain.model.TransactionType
import com.bookkeeper.app.domain.repository.AccountRepository
import com.bookkeeper.app.domain.repository.CategoryRepository
import com.bookkeeper.app.domain.repository.TransactionRepository
import com.bookkeeper.app.domain.usecase.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class BookKeeperApplication : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
        container.seedDefaults()
    }
}

class AppContainer(application: Application) {
    private val database = BookKeeperDatabase.create(application)
    val transactionRepository: TransactionRepository = TransactionRepositoryImpl(database.transactionDao())
    val accountRepository: AccountRepository = AccountRepositoryImpl(database.accountDao())
    val categoryRepository: CategoryRepository = CategoryRepositoryImpl(database.categoryDao())
    val addTransaction = AddTransactionUseCase(transactionRepository)
    val updateTransaction = UpdateTransactionUseCase(transactionRepository)
    val deleteTransaction = DeleteTransactionUseCase(transactionRepository)
    val dashboardSummary = GetDashboardSummaryUseCase()
    val categoryTotals = GetCategoryTotalsUseCase()
    val exportTransactions = ExportTransactionsUseCase()

    fun seedDefaults() {
        CoroutineScope(Dispatchers.IO).launch {
            if (accountRepository.count() == 0) {
                accountRepository.insert(Account(0, "Cash", "CASH", 0))
            }
            if (categoryRepository.count() == 0) {
                categoryRepository.insertDefaults(
                    listOf(
                        Category(0, "Sales", TransactionType.INCOME, "#0B8177", "trending_up"),
                        Category(0, "Other income", TransactionType.INCOME, "#4E9F70", "add"),
                        Category(0, "Food", TransactionType.EXPENSE, "#E3755C", "restaurant"),
                        Category(0, "Transport", TransactionType.EXPENSE, "#D4A84D", "directions_car"),
                        Category(0, "Bills", TransactionType.EXPENSE, "#6E8CC8", "receipt_long"),
                        Category(0, "Other expense", TransactionType.EXPENSE, "#8A729E", "more_horiz")
                    )
                )
            }
        }
    }
}
