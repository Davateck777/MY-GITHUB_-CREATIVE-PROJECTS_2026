/* ACCOUNT REPOSITORY: Domain-facing contract for account storage. */
package com.bookkeeper.app.domain.repository

import com.bookkeeper.app.domain.model.Account
import kotlinx.coroutines.flow.Flow

interface AccountRepository {
    fun observeActive(): Flow<List<Account>>
    suspend fun insert(account: Account): Long
    suspend fun count(): Int
}
