/* CATEGORY ENTITY: Room representation of income and expense categories. */
package com.bookkeeper.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.bookkeeper.app.domain.model.Category
import com.bookkeeper.app.domain.model.TransactionType

@Entity(tableName = "categories")
data class CategoryEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val type: String,
    val colorHex: String = "#0B8177",
    val iconName: String = "label",
    val isDefault: Boolean = true
) {
    fun toDomain() = Category(id, name, TransactionType.valueOf(type), colorHex, iconName, isDefault)
}
