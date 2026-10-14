/* DASHBOARD SUMMARY: Calculates balances from transactions instead of storing duplicate totals. */
package com.bookkeeper.app.domain.usecase

import com.bookkeeper.app.domain.model.BookkeepingTransaction
import com.bookkeeper.app.domain.model.TransactionType

class GetDashboardSummaryUseCase {
    operator fun invoke(transactions: List<BookkeepingTransaction>): DashboardSummary {
        val income = transactions.filter { it.type == TransactionType.INCOME }.sumOf { it.amountCents }
        val expenses = transactions.filter { it.type == TransactionType.EXPENSE }.sumOf { it.amountCents }
        return DashboardSummary(income, expenses, income - expenses)
    }
}

data class DashboardSummary(val incomeCents: Long, val expenseCents: Long, val balanceCents: Long)
