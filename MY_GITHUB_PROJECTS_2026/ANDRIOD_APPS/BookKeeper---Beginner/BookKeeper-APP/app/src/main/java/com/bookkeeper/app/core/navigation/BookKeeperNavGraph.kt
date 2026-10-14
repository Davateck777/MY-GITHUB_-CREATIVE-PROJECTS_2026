/* NAVIGATION GRAPH: Connects the five MVP screens and the add-transaction flow. */
package com.bookkeeper.app.core.navigation

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavDestination.Companion.hasRoute
import androidx.navigation.compose.*
import com.bookkeeper.app.AppContainer
import com.bookkeeper.app.feature.accounts.AccountsScreen
import com.bookkeeper.app.feature.dashboard.DashboardScreen
import com.bookkeeper.app.feature.dashboard.DashboardViewModel
import com.bookkeeper.app.feature.dashboard.DashboardViewModelFactory
import com.bookkeeper.app.feature.reports.ReportsScreen
import com.bookkeeper.app.feature.settings.SettingsScreen
import com.bookkeeper.app.feature.transactions.*

private data class NavItem(val route: String, val label: String, val icon: androidx.compose.ui.graphics.vector.ImageVector)

@Composable
fun BookKeeperNavGraph(container: AppContainer) {
    val navController = rememberNavController()
    val dashboardViewModel: DashboardViewModel = viewModel(factory = DashboardViewModelFactory(container.transactionRepository, container.dashboardSummary))
    val transactionViewModel: TransactionViewModel = viewModel(
        factory = TransactionViewModelFactory(container.transactionRepository, container.accountRepository, container.categoryRepository, container.addTransaction, container.deleteTransaction)
    )
    val items = listOf(
        NavItem("dashboard", "Home", Icons.Outlined.Home),
        NavItem("transactions", "Ledger", Icons.Outlined.ReceiptLong),
        NavItem("accounts", "Accounts", Icons.Outlined.AccountBalanceWallet),
        NavItem("reports", "Reports", Icons.Outlined.Assessment),
        NavItem("settings", "Settings", Icons.Outlined.Settings)
    )

    Scaffold(
        bottomBar = {
            NavigationBar {
                val currentRoute = navController.currentBackStackEntryAsState().value?.destination?.route
                items.forEach { item ->
                    NavigationBarItem(
                        selected = currentRoute == item.route,
                        onClick = { navController.navigate(item.route) { launchSingleTop = true; restoreState = true } },
                        icon = { Icon(item.icon, contentDescription = item.label) },
                        label = { Text(item.label) }
                    )
                }
            }
        }
    ) { padding: PaddingValues ->
        NavHost(navController, startDestination = "dashboard", modifier = Modifier.padding(padding)) {
            composable("dashboard") { DashboardScreen(dashboardViewModel) { navController.navigate("add") } }
            composable("transactions") { TransactionListScreen(transactionViewModel) { navController.navigate("add") } }
            composable("add") { TransactionFormScreen(transactionViewModel, onSaved = { navController.popBackStack() }, onCancel = { navController.popBackStack() }) }
            composable("accounts") { AccountsScreen(container.accountRepository) }
            composable("reports") { ReportsScreen(container.transactionRepository) }
            composable("settings") { SettingsScreen() }
        }
    }
}
