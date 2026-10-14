/* TRANSACTION MODEL: Stores money movement using integer cents to avoid floating-point rounding. */
package com.bookkeeper.app.domain.model

data class BookkeepingTransaction(
    val id: Long,
    val accountId: Long,
    val categoryId: Long,
    val type: TransactionType,
    val amountCents: Long,
    val currency: String,
    val description: String,
    val transactionDate: String,
    val notes: String = "",
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
