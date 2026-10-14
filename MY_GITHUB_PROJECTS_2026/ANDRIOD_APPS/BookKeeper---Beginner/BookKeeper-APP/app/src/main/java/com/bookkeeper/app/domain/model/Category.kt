/* CATEGORY MODEL: Classifies transactions as income or expenses for reporting. */
package com.bookkeeper.app.domain.model

data class Category(
    val id: Long,
    val name: String,
    val type: TransactionType,
    val colorHex: String = "#0B8177",
    val iconName: String = "label",
    val isDefault: Boolean = true
)
