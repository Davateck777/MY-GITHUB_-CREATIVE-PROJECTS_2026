/* DOMAIN UNIT TESTS: Verifies amount validation before persistence is reached. */
package com.bookkeeper.app

import com.bookkeeper.app.domain.model.BookkeepingTransaction
import com.bookkeeper.app.domain.model.TransactionType
import com.bookkeeper.app.domain.repository.TransactionRepository
import com.bookkeeper.app.domain.usecase.AddTransactionUseCase
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.emptyFlow
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertThrows
import org.junit.Test

class TransactionUseCaseTest {
    @Test
    fun rejects_zero_amount() {
        val repository = object : TransactionRepository {
            override fun observeAll(): Flow<List<BookkeepingTransaction>> = emptyFlow()
            override suspend fun insert(item: BookkeepingTransaction): Long = 1L
            override suspend fun update(item: BookkeepingTransaction) = Unit
            override suspend fun delete(item: BookkeepingTransaction) = Unit
        }
        val useCase = AddTransactionUseCase(repository)
        val invalid = BookkeepingTransaction(0, 1, 1, TransactionType.EXPENSE, 0, "USD", "Coffee", "2025-01-01")
        assertThrows(IllegalArgumentException::class.java) { runBlocking { useCase(invalid) } }
    }
}
