



## Notation

- `[ ]` = the idea, requirement, feature, or deliverable to build.
- `( )` = the reason, justification, or explanation behind it.

# Filled Problem → Idea Table

| Field                                               | Filled definition                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **YOUR_ROLE (FUNC.)**                               | `( SOFTWARE ENGINEER )`                                                                                                                                                                                                                                                                                            |
| **TARGET_AUDIENCE / JOB_ROLE**                      | `NONE — primary audience is not yet specified. MVP assumption: micro-business owners, freelancers, and individuals who need simple bookkeeping.`                                                                                                                                                                   |
| **JOB_ROLE (FUNC.)**                                | `NONE — final user role will be confirmed before implementation.`                                                                                                                                                                                                                                                  |
| **WHAT_PROBLEM**                                    | `[ People and small businesses need a simple way to record income, expenses, transactions, account balances, and financial activity from their Android device. ]`                                                                                                                                                  |
| **WHY_PROBLEM**                                     | `( Financial records are often scattered across notebooks, spreadsheets, receipts, bank messages, and memory. This creates poor cash-flow visibility, missed expenses, manual errors, and difficulty preparing useful financial summaries. )`                                                                      |
| **ANALYSIS (PROBLEM)**                              | `[ The MVP requires secure transaction recording, income and expense categorization, account tracking, search and filtering, dashboard summaries, monthly reports, data export, and reliable offline access. The app must prioritize privacy, simple navigation, accurate calculations, and low cognitive load. ]` |
| **SOLUTION**                                        | `[ BookKeeper ]`                                                                                                                                                                                                                                                                                                   |
| **SOLUTION_FORMAT**                                 | `( ANDROID_MOBILE_APP )`                                                                                                                                                                                                                                                                                           |
| **WHY_SOLUTION**                                    | `(   )`                                                                                                                                                                                                                                                                                                            |
| **HOW_IMPLEMENT_SOLUTION**                          | `[ Build BookKeeper as a native Android application using Kotlin, Jetpack Compose, Room Database, MVVM/Clean Architecture, Material 3, and local-first data storage. ]`                                                                                                                                            |
| **WHERE_IMPLEMENT_SOLUTION(S)**                     | `[ Android Studio, Kotlin, Jetpack Compose, Android Emulator or physical Android device, Room SQLite database, Android DataStore, Android Keystore, and Google Play distribution for a later release. ]`                                                                                                           |
| **WHAT MUST BE CONNECTED TOGETHER TO MAKE IT WORK** | `( The Compose screens, navigation, ViewModels, domain use cases, transaction repository, Room database, calculation logic, report generator, export system, settings, and security controls must use the same validated financial data model. )`                                                                  |
| **TARGET_AUDIENCE**                                 | `[ MVP assumption: freelancers, micro-business owners, sole traders, students, households, and individuals who want lightweight bookkeeping without complex accounting software. ]`                                                                                                                                |
| **BRIEFLY DESCRIBE SYSTEMS TO BE IMPLEMENTED**      | `[ Transaction management system, account system, category system, dashboard system, reporting system, search/filter system, export/backup system, settings system, local database, validation layer, security layer, automated tests, and Android UI. ]`                                                          |
| **RETURN-FILLED-TABLE**                             | `[ YES ]`                                                                                                                                                                                                                                                                                                          |
| **DEVELOP FINALIZED MVP**                           | `[ YES — wait for the CREATE FILES_EACH command before creating project files. ]`                                                                                                                                                                                                                                  |
| **DESIRED OUTPUT**                                  | `[ BookKeeper — Android Mobile App ]`                                                                                                                                                                                                                                                                              |

---

# BookKeeper MVP Features

## 1. Transaction management

- `[ ]` Add income transaction.
- `[ ]` Add expense transaction.
- `[ ]` Edit transaction.
- `[ ]` Delete transaction.
- `[ ]` Add transaction date.
- `[ ]` Add transaction description.
- `[ ]` Add transaction amount.
- `[ ]` Select account.
- `[ ]` Select category.
- `[ ]` Add optional notes.
- `[ ]` Validate that amount is greater than zero.

## 2. Account management

- `[ ]` Create cash, bank, wallet, or custom account.
- `[ ]` Set opening balance.
- `[ ]` Display current balance.
- `[ ]` View account-specific transactions.
- `[ ]` Archive an account without deleting historical transactions.

## 3. Categories

- `[ ]` Default income categories.
- `[ ]` Default expense categories.
- `[ ]` Create custom categories.
- `[ ]` Edit category name.
- `[ ]` Assign category colors or icons.
- `[ ]` Prevent deletion of categories used by existing transactions.

## 4. Dashboard

- `[ ]` Current total balance.
- `[ ]` Total income for selected period.
- `[ ]` Total expenses for selected period.
- `[ ]` Net cash flow.
- `[ ]` Recent transactions.
- `[ ]` Spending by category.
- `[ ]` Period selector: week, month, quarter, or custom range.

## 5. Reports and export

- `[ ]` Monthly income summary.
- `[ ]` Monthly expense summary.
- `[ ]` Net cash-flow summary.
- `[ ]` Category breakdown.
- `[ ]` CSV export.
- `[ ]` Share exported report through Android sharing.
- `[ ]` Local backup and restore.

## 6. Privacy and security

- `[ ]` Optional PIN lock.
- `[ ]` Biometric unlock where supported.
- `[ ]` Store sensitive settings using Android Keystore/DataStore.
- `[ ]` Do not transmit financial data in the MVP.
- `[ ]` Display clear privacy information.
- `[ ]` Avoid collecting unnecessary personal information.

---

# Design Phase

## Recommended technology stack

```text
Language: Kotlin
UI: Jetpack Compose
Architecture: MVVM + Clean Architecture
Database: Room / SQLite
Dependency Injection: Hilt
Navigation: Navigation Compose
State: StateFlow
Settings: DataStore
Security: Android Keystore + BiometricPrompt
Testing: JUnit + Compose UI tests
Design system: Material 3
```

## Application layers

```text
Compose UI
    ↓
ViewModel / StateFlow
    ↓
Domain Use Cases
    ↓
Repository Interfaces
    ↓
Room Database
    ↓
SQLite Storage
```

## Core data models

### Transaction

```text
id
accountId
categoryId
type: INCOME or EXPENSE
amount
currency
description
transactionDate
notes
createdAt
updatedAt
```

### Account

```text
id
name
accountType
openingBalance
currency
isArchived
createdAt
```

### Category

```text
id
name
type: INCOME or EXPENSE
color
icon
isDefault
```

### App settings

```text
currency
firstDayOfWeek
pinLockEnabled
biometricEnabled
darkMode
```

---

# Implementation Phase — Step-by-Step

## Step 1: Create the Android project

1. Open Android Studio.
2. Create a Kotlin Android project.
3. Select Jetpack Compose.
4. Set the package name, for example:

```text
com.bookkeeper.app
```

5. Configure the minimum supported Android version.
6. Add Material 3 and navigation dependencies.
7. Create the base application theme.

---

## Step 2: Define the domain models

Create Kotlin data classes for:

```text
Transaction
Account
Category
TransactionType
AccountType
AppSettings
```

Keep these models independent of Room so the business layer is easy to test.

---

## Step 3: Implement the Room database

Create:

```text
BookKeeperDatabase
TransactionEntity
AccountEntity
CategoryEntity
TransactionDao
AccountDao
CategoryDao
```

Implement DAO methods for:

```text
Insert transaction
Update transaction
Delete transaction
Find transaction by ID
List recent transactions
Filter by date
Filter by category
Calculate income
Calculate expenses
Calculate balances
```

---

## Step 4: Create repository implementations

Create repository interfaces:

```text
TransactionRepository
AccountRepository
CategoryRepository
```

Then create Room-backed implementations.

Repositories should hide database details from the ViewModels and UI.

---

## Step 5: Implement domain use cases

Create focused use cases:

```text
AddTransactionUseCase
UpdateTransactionUseCase
DeleteTransactionUseCase
GetRecentTransactionsUseCase
GetDashboardSummaryUseCase
GetCategoryTotalsUseCase
CreateAccountUseCase
GetAccountsUseCase
ExportTransactionsUseCase
```

Each use case should perform validation before changing stored data.

---

## Step 6: Build the navigation shell

Create the main navigation destinations:

```text
Dashboard
Transactions
Add Transaction
Accounts
Reports
Settings
```

Use a bottom navigation bar or navigation rail depending on screen width.

---

## Step 7: Build the transaction flow

1. Create the add-transaction screen.
2. Add income/expense selection.
3. Add amount input.
4. Add category selection.
5. Add account selection.
6. Add date picker.
7. Add optional description and notes.
8. Validate input.
9. Save transaction through the ViewModel.
10. Return to the transaction list.
11. Refresh the dashboard totals.

---

## Step 8: Build the dashboard

The dashboard should display:

```text
Current balance
Income this month
Expenses this month
Net cash flow
Recent transactions
Top spending category
```

The dashboard must calculate values from the database rather than storing duplicated totals.

---

## Step 9: Build reports

Implement report queries for:

```text
Date range totals
Income by category
Expenses by category
Account balances
Monthly comparisons
```

Add simple Compose charts or visual summary cards.

---

## Step 10: Add export and backup

Implement:

```text
CSV export
JSON backup
JSON restore
Android share intent
```

Before restore:

1. Validate the backup format.
2. Confirm the user wants to replace or merge data.
3. Create a backup of current data.
4. Import the validated records.
5. Refresh all screens.

---

## Step 11: Add security controls

1. Add optional PIN lock.
2. Add biometric unlock.
3. Store security preferences securely.
4. Avoid logging transaction amounts or financial descriptions.
5. Keep all MVP data local to the device.
6. Add a privacy screen explaining local storage.

---

## Step 12: Test the MVP

### Unit tests

- `[ ]` Add income transaction.
- `[ ]` Add expense transaction.
- `[ ]` Reject zero amount.
- `[ ]` Reject negative amount.
- `[ ]` Calculate balance correctly.
- `[ ]` Filter transactions by date.
- `[ ]` Calculate category totals.
- `[ ]` Delete a transaction.
- `[ ]` Export valid CSV.
- `[ ]` Restore valid backup.

### UI tests

- `[ ]` Navigate to dashboard.
- `[ ]` Open add transaction screen.
- `[ ]` Complete transaction form.
- `[ ]` Display new transaction.
- `[ ]` View account list.
- `[ ]` Open reports.
- `[ ]` Enable and disable app lock.

---

# Planned Android File Structure

```text
BookKeeper/
├── settings.gradle.kts
├── build.gradle.kts
├── gradle.properties
├── README.md
│
└── app/
    ├── build.gradle.kts
    ├── proguard-rules.pro
    │
    └── src/
        ├── main/
        │   ├── AndroidManifest.xml
        │   │
        │   ├── java/com/bookkeeper/app/
        │   │   ├── MainActivity.kt
        │   │   ├── BookKeeperApplication.kt
        │   │   │
        │   │   ├── core/
        │   │   │   ├── navigation/
        │   │   │   │   └── BookKeeperNavGraph.kt
        │   │   │   ├── security/
        │   │   │   │   ├── AppLockManager.kt
        │   │   │   │   └── BiometricManager.kt
        │   │   │   ├── theme/
        │   │   │   │   ├── Color.kt
        │   │   │   │   ├── Theme.kt
        │   │   │   │   └── Type.kt
        │   │   │   └── util/
        │   │   │       ├── CurrencyFormatter.kt
        │   │   │       └── DateFormatter.kt
        │   │   │
        │   │   ├── data/
        │   │   │   ├── local/
        │   │   │   │   ├── BookKeeperDatabase.kt
        │   │   │   │   ├── TransactionDao.kt
        │   │   │   │   ├── AccountDao.kt
        │   │   │   │   ├── CategoryDao.kt
        │   │   │   │   ├── TransactionEntity.kt
        │   │   │   │   ├── AccountEntity.kt
        │   │   │   │   └── CategoryEntity.kt
        │   │   │   ├── repository/
        │   │   │   │   ├── TransactionRepositoryImpl.kt
        │   │   │   │   ├── AccountRepositoryImpl.kt
        │   │   │   │   └── CategoryRepositoryImpl.kt
        │   │   │   └── backup/
        │   │   │       ├── BackupExporter.kt
        │   │   │       └── BackupImporter.kt
        │   │   │
        │   │   ├── domain/
        │   │   │   ├── model/
        │   │   │   │   ├── Transaction.kt
        │   │   │   │   ├── Account.kt
        │   │   │   │   ├── Category.kt
        │   │   │   │   └── TransactionType.kt
        │   │   │   ├── repository/
        │   │   │   │   ├── TransactionRepository.kt
        │   │   │   │   ├── AccountRepository.kt
        │   │   │   │   └── CategoryRepository.kt
        │   │   │   └── usecase/
        │   │   │       ├── AddTransactionUseCase.kt
        │   │   │       ├── UpdateTransactionUseCase.kt
        │   │   │       ├── DeleteTransactionUseCase.kt
        │   │   │       ├── GetDashboardSummaryUseCase.kt
        │   │   │       ├── GetCategoryTotalsUseCase.kt
        │   │   │       └── ExportTransactionsUseCase.kt
        │   │   │
        │   │   └── feature/
        │   │       ├── dashboard/
        │   │       │   ├── DashboardScreen.kt
        │   │       │   ├── DashboardViewModel.kt
        │   │       │   └── DashboardUiState.kt
        │   │       ├── transactions/
        │   │       │   ├── TransactionListScreen.kt
        │   │       │   ├── TransactionFormScreen.kt
        │   │       │   ├── TransactionViewModel.kt
        │   │       │   └── TransactionUiState.kt
        │   │       ├── accounts/
        │   │       │   ├── AccountsScreen.kt
        │   │       │   └── AccountsViewModel.kt
        │   │       ├── reports/
        │   │       │   ├── ReportsScreen.kt
        │   │       │   └── ReportsViewModel.kt
        │   │       └── settings/
        │   │           ├── SettingsScreen.kt
        │   │           └── SettingsViewModel.kt
        │   │
        │   └── res/
        │       ├── drawable/
        │       ├── mipmap/
        │       ├── values/
        │       │   ├── strings.xml
        │       │   ├── colors.xml
        │       │   └── themes.xml
        │       └── xml/
        │
        ├── test/
        │   └── java/com/bookkeeper/app/
        │       ├── TransactionUseCaseTest.kt
        │       ├── DashboardSummaryTest.kt
        │       └── ExportTransactionsTest.kt
        │
        └── androidTest/
            └── java/com/bookkeeper/app/
                ├── TransactionFormTest.kt
                ├── DashboardScreenTest.kt
                └── NavigationTest.kt
```

---

# MVP Completion Criteria

The BookKeeper MVP is complete when:

- `[ ]` A user can create an account. ✔
- `[ ]` A user can record income. ✔
- `[ ]` A user can record expenses.✔
- `[ ]` A user can edit and delete transactions. ✔
- `[ ]` The dashboard calculates balances correctly. ✔
- `[ ]` Transactions can be filtered and searched. ✔
- `[ ]` Categories can be selected and managed.✔
- `[ ]` Monthly financial summaries are available. ✔
- `[ ]` Data persists after closing and reopening the app. ✔
- `[ ]` CSV export works. ✔
- `[ ]` Backup and restore work.✔
- `[ ]` App locking can be enabled.✔
- `[ ]` Unit and UI tests pass.✔🤔🧐
- `[ ]` No cloud account is required for the MVP. ✔
- `[ ]` The app clearly explains that it is not professional accounting or financial advice. ✔

I will wait for your command:

```text
CREATE FILES_EACH
```