/* TRANSACTION ENTITY: Room representation of a bookkeeping transaction. */
package com.bookkeeper.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.bookkeeper.app.domain.model.BookkeepingTransaction
import com.bookkeeper.app.domain.model.TransactionType

@Entity(tableName = "transactions")
data class TransactionEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val accountId: Long,
    val categoryId: Long,
    val type: String,
    val amountCents: Long,
    val currency: String,
    val description: String,
    val transactionDate: String,
    val notes: String = "",
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
) {
    fun toDomain() = BookkeepingTransaction(
        id, accountId, categoryId, TransactionType.valueOf(type), amountCents,
        currency, description, transactionDate, notes, createdAt, updatedAt
    )

    companion object {
        fun fromDomain(item: BookkeepingTransaction) = TransactionEntity(
            item.id, item.accountId, item.categoryId, item.type.name, item.amountCents,
            item.currency, item.description, item.transactionDate, item.notes,
            item.createdAt, item.updatedAt
        )
    }
}
