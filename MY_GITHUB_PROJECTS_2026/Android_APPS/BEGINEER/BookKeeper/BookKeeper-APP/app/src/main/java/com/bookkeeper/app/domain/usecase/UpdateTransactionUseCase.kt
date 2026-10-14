/* UPDATE TRANSACTION USE CASE: Reuses the same validation rules for edits. */
package com.bookkeeper.app.domain.usecase

import com.bookkeeper.app.domain.model.BookkeepingTransaction
import com.bookkeeper.app.domain.repository.TransactionRepository

class UpdateTransactionUseCase(private val repository: TransactionRepository) {
    suspend operator fun invoke(item: BookkeepingTransaction) {
        require(item.amountCents > 0) { "Amount must be greater than zero." }
        require(item.description.isNotBlank()) { "Description is required." }
        repository.update(item)
    }
}
