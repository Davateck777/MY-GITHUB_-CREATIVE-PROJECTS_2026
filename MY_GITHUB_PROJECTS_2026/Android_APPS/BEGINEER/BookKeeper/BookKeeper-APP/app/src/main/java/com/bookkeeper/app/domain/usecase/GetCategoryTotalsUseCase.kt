/* CATEGORY TOTALS: Groups expense transactions for the reports screen. */
package com.bookkeeper.app.domain.usecase

import com.bookkeeper.app.domain.model.BookkeepingTransaction
import com.bookkeeper.app.domain.model.TransactionType

class GetCategoryTotalsUseCase {
    operator fun invoke(transactions: List<BookkeepingTransaction>): Map<Long, Long> = transactions
        .filter { it.type == TransactionType.EXPENSE }
        .groupingBy { it.categoryId }
        .fold(0L) { total, item -> total + item.amountCents }
}
