/* ACCOUNT DAO: Exposes reactive account queries and account writes. */
package com.bookkeeper.app.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface AccountDao {
    @Query("SELECT * FROM accounts WHERE isArchived = 0 ORDER BY name")
    fun observeActive(): Flow<List<AccountEntity>>

    @Insert
    suspend fun insert(item: AccountEntity): Long

    @Update
    suspend fun update(item: AccountEntity)

    @Query("SELECT COUNT(*) FROM accounts")
    suspend fun count(): Int
}
