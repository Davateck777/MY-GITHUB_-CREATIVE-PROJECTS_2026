/* CATEGORY REPOSITORY IMPLEMENTATION: Adapts Room category records to domain models. */
package com.bookkeeper.app.data.repository

import com.bookkeeper.app.data.local.CategoryDao
import com.bookkeeper.app.data.local.CategoryEntity
import com.bookkeeper.app.domain.model.Category
import com.bookkeeper.app.domain.repository.CategoryRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class CategoryRepositoryImpl(private val dao: CategoryDao) : CategoryRepository {
    override fun observeAll(): Flow<List<Category>> = dao.observeAll().map { list -> list.map { it.toDomain() } }
    override suspend fun insertDefaults(categories: List<Category>) = dao.insertAll(categories.map { CategoryEntity(it.id, it.name, it.type.name, it.colorHex, it.iconName, it.isDefault) })
    override suspend fun count(): Int = dao.count()
}
