/* DELETE TRANSACTION USE CASE: Removes a selected transaction from local storage. */
package com.bookkeeper.app.domain.usecase

import com.bookkeeper.app.domain.model.BookkeepingTransaction
import com.bookkeeper.app.domain.repository.TransactionRepository

class DeleteTransactionUseCase(private val repository: TransactionRepository) {
    suspend operator fun invoke(item: BookkeepingTransaction) = repository.delete(item)
}
