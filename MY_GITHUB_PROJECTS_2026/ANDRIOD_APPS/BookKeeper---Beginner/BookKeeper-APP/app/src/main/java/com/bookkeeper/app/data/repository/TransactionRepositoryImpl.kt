/* TRANSACTION REPOSITORY IMPLEMENTATION: Adapts Room entities to domain models. */
package com.bookkeeper.app.data.repository

import com.bookkeeper.app.data.local.TransactionDao
import com.bookkeeper.app.data.local.TransactionEntity
import com.bookkeeper.app.domain.model.BookkeepingTransaction
import com.bookkeeper.app.domain.repository.TransactionRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class TransactionRepositoryImpl(private val dao: TransactionDao) : TransactionRepository {
    override fun observeAll(): Flow<List<BookkeepingTransaction>> = dao.observeAll().map { list -> list.map { it.toDomain() } }
    override suspend fun insert(item: BookkeepingTransaction): Long = dao.insert(TransactionEntity.fromDomain(item))
    override suspend fun update(item: BookkeepingTransaction) = dao.update(TransactionEntity.fromDomain(item))
    override suspend fun delete(item: BookkeepingTransaction) = dao.delete(TransactionEntity.fromDomain(item))
}
