/* TRANSACTION REPOSITORY: Domain-facing contract for transaction storage. */
package com.bookkeeper.app.domain.repository

import com.bookkeeper.app.domain.model.BookkeepingTransaction
import kotlinx.coroutines.flow.Flow

interface TransactionRepository {
    fun observeAll(): Flow<List<BookkeepingTransaction>>
    suspend fun insert(item: BookkeepingTransaction): Long
    suspend fun update(item: BookkeepingTransaction)
    suspend fun delete(item: BookkeepingTransaction)
}
