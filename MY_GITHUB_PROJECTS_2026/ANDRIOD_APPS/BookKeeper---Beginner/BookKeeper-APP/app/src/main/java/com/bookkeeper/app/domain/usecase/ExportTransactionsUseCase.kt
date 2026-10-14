/* CSV EXPORT: Converts transactions into a shareable comma-separated report. */
package com.bookkeeper.app.domain.usecase

import com.bookkeeper.app.domain.model.BookkeepingTransaction

class ExportTransactionsUseCase {
    operator fun invoke(items: List<BookkeepingTransaction>): String = buildString {
        appendLine("date,type,amount,currency,description,notes")
        items.forEach { item ->
            appendLine(listOf(item.transactionDate, item.type.name, item.amountCents / 100.0, item.currency, item.description, item.notes).joinToString(",") { value -> "\"${value.toString().replace("\"", "\"\"")}\"" })
        }
    }
}
