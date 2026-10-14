/* ACCOUNT REPOSITORY IMPLEMENTATION: Adapts Room account records to domain models. */
package com.bookkeeper.app.data.repository

import com.bookkeeper.app.data.local.AccountDao
import com.bookkeeper.app.data.local.AccountEntity
import com.bookkeeper.app.domain.model.Account
import com.bookkeeper.app.domain.repository.AccountRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class AccountRepositoryImpl(private val dao: AccountDao) : AccountRepository {
    override fun observeActive(): Flow<List<Account>> = dao.observeActive().map { list -> list.map { it.toDomain() } }
    override suspend fun insert(account: Account): Long = dao.insert(AccountEntity(account.id, account.name, account.accountType, account.openingBalanceCents, account.currency, account.isArchived))
    override suspend fun count(): Int = dao.count()
}
