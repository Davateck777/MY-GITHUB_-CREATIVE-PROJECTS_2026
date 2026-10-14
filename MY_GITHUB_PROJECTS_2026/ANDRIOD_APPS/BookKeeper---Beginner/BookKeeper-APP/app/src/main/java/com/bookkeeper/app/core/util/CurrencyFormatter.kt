/* CURRENCY FORMATTER: Provides consistent two-decimal display for integer cents. */
package com.bookkeeper.app.core.util

import java.text.NumberFormat
import java.util.Locale

fun formatCents(cents: Long, currency: String = "USD"): String {
    val formatter = NumberFormat.getCurrencyInstance(Locale.US)
    formatter.currency = java.util.Currency.getInstance(currency)
    return formatter.format(cents / 100.0)
}
