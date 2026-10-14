/* ACCOUNT ENTITY: Room representation of an account record. */
package com.bookkeeper.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.bookkeeper.app.domain.model.Account

@Entity(tableName = "accounts")
data class AccountEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val accountType: String,
    val openingBalanceCents: Long,
    val currency: String = "USD",
    val isArchived: Boolean = false
) {
    fun toDomain() = Account(id, name, accountType, openingBalanceCents, currency, isArchived)
}
