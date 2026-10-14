/* DATE FORMATTER: Keeps transaction dates stable as ISO strings in storage and readable in UI. */
package com.bookkeeper.app.core.util

import java.time.LocalDate
import java.time.format.DateTimeFormatter

private val displayFormatter = DateTimeFormatter.ofPattern("dd MMM yyyy")

fun formatDate(isoDate: String): String = runCatching {
    LocalDate.parse(isoDate).format(displayFormatter)
}.getOrDefault(isoDate)
