/* CATEGORY REPOSITORY: Domain-facing contract for category storage. */
package com.bookkeeper.app.domain.repository

import com.bookkeeper.app.domain.model.Category
import kotlinx.coroutines.flow.Flow

interface CategoryRepository {
    fun observeAll(): Flow<List<Category>>
    suspend fun insertDefaults(categories: List<Category>)
    suspend fun count(): Int
}
