# BookKeeper Android MVP

A local-first Android bookkeeping MVP for recording income and expenses, viewing balances, managing accounts, and exporting transaction data.

## Open the project

Open `/home/user/BookKeeper` in Android Studio and let Gradle sync.

```text
Minimum SDK: 26
Compile SDK: 35
Language: Kotlin
UI: Jetpack Compose + Material 3
Database: Room / SQLite
```

## MVP features

- Dashboard balance summary
- Income and expense transactions
- Account list
- Default and custom categories
- Transaction list
- Monthly reports
- CSV export through Android sharing
- Local storage with Room
- Optional settings screen

## Build and test

```bash
./gradlew test
./gradlew assembleDebug
```

Install the debug APK on an emulator or connected Android device through Android Studio.

## Project boundaries

This MVP is local-first and does not include bank synchronization, cloud accounts, payments, tax filing, or professional accounting advice. Do not use it as a replacement for regulated accounting services.
