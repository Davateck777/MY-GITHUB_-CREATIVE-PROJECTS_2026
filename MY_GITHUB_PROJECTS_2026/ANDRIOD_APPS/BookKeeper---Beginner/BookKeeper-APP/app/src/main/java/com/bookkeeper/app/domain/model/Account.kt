/* ACCOUNT MODEL: Represents a cash, bank, wallet, or custom bookkeeping account. */
package com.bookkeeper.app.domain.model

data class Account(
    val id: Long,
    val name: String,
    val accountType: String,
    val openingBalanceCents: Long,
    val currency: String = "USD",
    val isArchived: Boolean = false
)
