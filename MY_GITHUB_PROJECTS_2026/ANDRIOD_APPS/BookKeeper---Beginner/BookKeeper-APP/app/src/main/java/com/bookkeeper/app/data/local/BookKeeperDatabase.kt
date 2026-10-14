/* ROOM DATABASE: Defines the local SQLite schema used by the offline-first MVP. */
package com.bookkeeper.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [TransactionEntity::class, AccountEntity::class, CategoryEntity::class],
    version = 1,
    exportSchema = false
)
abstract class BookKeeperDatabase : RoomDatabase() {
    abstract fun transactionDao(): TransactionDao
    abstract fun accountDao(): AccountDao
    abstract fun categoryDao(): CategoryDao

    companion object {
        @Volatile private var instance: BookKeeperDatabase? = null

        fun create(context: Context): BookKeeperDatabase = instance ?: synchronized(this) {
            instance ?: Room.databaseBuilder(
                context.applicationContext,
                BookKeeperDatabase::class.java,
                "bookkeeper.db"
            ).build().also { instance = it }
        }
    }
}
