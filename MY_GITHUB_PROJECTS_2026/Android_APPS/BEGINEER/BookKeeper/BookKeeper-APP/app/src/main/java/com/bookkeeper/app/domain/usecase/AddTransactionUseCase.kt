/* ADD TRANSACTION USE CASE: Validates money movement before persisting it. */
package com.bookkeeper.app.domain.usecase

import com.bookkeeper.app.domain.model.BookkeepingTransaction
import com.bookkeeper.app.domain.repository.TransactionRepository

class AddTransactionUseCase(private val repository: TransactionRepository) {
    suspend operator fun invoke(item: BookkeepingTransaction): Long {
        require(item.amountCents > 0) { "Amount must be greater than zero." }
        require(item.description.isNotBlank()) { "Description is required." }
        return repository.insert(item)
    }
}
