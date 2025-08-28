// Exponential balance check helper for Node-RED nodes (buyer/seller)
// Usage: const { startExponentialBalanceCheck } = require('./balance-check-helper');
//
// startExponentialBalanceCheck({
//   node, // Node-RED node instance
//   hederaService, // HederaAccountService instance
//   getAccountId: () => node.deviceInfo && node.deviceInfo.accountId, // function returning accountId
//   onLowBalance: (balanceHbars) => node.status({ fill: "yellow", shape: "ring", text: `Low balance: ${balanceHbars} HBAR` }),
//   onZeroBalance: (balanceHbars) => node.status({ fill: "red", shape: "ring", text: `Balance: ${balanceHbars} HBAR` }),
//   onError: () => node.status({ fill: "red", shape: "ring", text: "Balance check failed" }),
//   initialDelayMs: 5000,
//   maxDelayMs: 5 * 60 * 1000
// });

function startExponentialBalanceCheck({
  node,
  hederaService,
  getAccountId,
  onLowBalance,
  onZeroBalance,
  onError,
  initialDelayMs = 5000,
  maxDelayMs = 5 * 60 * 1000
}) {
  let balanceCheckTimeout = null;
  let delay = initialDelayMs;

  async function checkAndSchedule() {
    let retries = 0;
    let accountId;
    while ((!(accountId = getAccountId()) || !hederaService) && retries < 30) {
      await new Promise(r => setTimeout(r, 1000));
      retries++;
    }
    let success = false;
    if (accountId && hederaService) {
      try {
        const balanceTinybars = await hederaService.getAccountBalanceTinybars(accountId);
        const balanceHbars = (balanceTinybars / 100000000).toFixed(2);
        if (parseFloat(balanceHbars) < 5 && parseFloat(balanceHbars) > 0) {
          onLowBalance && onLowBalance(balanceHbars);
        } else if (parseFloat(balanceHbars) <= 0) {
          onZeroBalance && onZeroBalance(balanceHbars);
        }
        success = true;
      } catch (err) {
        onError && onError();
      }
    }
    if (success) {
      delay = initialDelayMs;
    } else {
      delay = Math.min(delay * 2, maxDelayMs);
    }
    balanceCheckTimeout = setTimeout(checkAndSchedule, delay);
  }
  checkAndSchedule();
  // Return a cleanup function
  return () => {
    if (balanceCheckTimeout) clearTimeout(balanceCheckTimeout);
  };
}

module.exports = { startExponentialBalanceCheck };
