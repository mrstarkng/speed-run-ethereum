"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";
import { deployedContracts } from "@/contracts/deployedContracts";

type StakeLog = {
  staker: string;
  amount: bigint;
  transactionHash: string;
};

type ChainDeployment = {
  ExampleExternalContract?: {
    address: string;
    abi: any[];
  };
  Staker?: {
    address: string;
    abi: any[];
  };
};

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<any>;
      on?: (event: string, handler: (...args: any[]) => void) => void;
      removeListener?: (event: string, handler: (...args: any[]) => void) => void;
    };
  }
}

const EMPTY_DEPLOYMENT: ChainDeployment = {};

export default function StakingsPage() {
  const [account, setAccount] = useState<string | undefined>();
  const [chainId, setChainId] = useState<number | undefined>();
  const [provider, setProvider] = useState<BrowserProvider | undefined>();
  const [stakerContract, setStakerContract] = useState<Contract | undefined>();
  const [exampleContract, setExampleContract] = useState<Contract | undefined>();
  const [stakeLogs, setStakeLogs] = useState<StakeLog[]>([]);
  const [stakeInput, setStakeInput] = useState("0.1");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [contractBalance, setContractBalance] = useState<bigint>(0n);
  const [userBalance, setUserBalance] = useState<bigint>(0n);
  const [threshold, setThreshold] = useState<bigint>(0n);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [openForWithdraw, setOpenForWithdraw] = useState(false);
  const [completed, setCompleted] = useState(false);

  const chainDeployment = useMemo<ChainDeployment>(() => {
    if (!chainId) return EMPTY_DEPLOYMENT;
    return (deployedContracts as Record<number, ChainDeployment>)[chainId] ?? EMPTY_DEPLOYMENT;
  }, [chainId]);

  const stakerDefinition = chainDeployment.Staker;
  const exampleDefinition = chainDeployment.ExampleExternalContract;

  const canInteract = Boolean(provider && stakerDefinition && stakerDefinition.address);

  const refreshState = useCallback(async () => {
    if (!provider || !stakerDefinition?.address || !stakerContract) {
      return;
    }

    const [balance, thresholdValue, timeRemaining, withdrawFlag, userStake] = await Promise.all([
      provider.getBalance(stakerDefinition.address),
      stakerContract.threshold(),
      stakerContract.timeLeft(),
      stakerContract.openForWithdraw(),
      account ? stakerContract.balances(account) : Promise.resolve(0n),
    ]);

    setContractBalance(balance);
    setThreshold(thresholdValue);
    setTimeLeft(Number(timeRemaining));
    setOpenForWithdraw(Boolean(withdrawFlag));
    setUserBalance(userStake);

    if (exampleContract) {
      const isCompleted: boolean = await exampleContract.completed();
      setCompleted(isCompleted);
    }

    if (stakerContract.filters?.Stake) {
      const filter = stakerContract.filters.Stake();
      const history = await stakerContract.queryFilter(filter, 0, "latest");
      const parsed = history.map(log => ({
        staker: log.args?.staker as string,
        amount: log.args?.amount as bigint,
        transactionHash: log.transactionHash,
      }));
      setStakeLogs(parsed.reverse());
    }
  }, [provider, stakerContract, stakerDefinition?.address, account, exampleContract]);

  const attachContracts = useCallback(async () => {
    if (!provider || !stakerDefinition?.address || !stakerDefinition?.abi) {
      return;
    }
    const contract = new Contract(stakerDefinition.address, stakerDefinition.abi, provider);
    setStakerContract(contract);

    if (exampleDefinition?.address && exampleDefinition?.abi) {
      setExampleContract(new Contract(exampleDefinition.address, exampleDefinition.abi, provider));
    }
  }, [provider, stakerDefinition?.address, stakerDefinition?.abi, exampleDefinition?.address, exampleDefinition?.abi]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) {
      return;
    }

    const nextProvider = new BrowserProvider(window.ethereum as any);
    setProvider(nextProvider);

    const handleAccountsChanged = (accounts: string[]) => {
      setAccount(accounts[0]);
    };

    const handleChainChanged = (hexId: string) => {
      setChainId(Number.parseInt(hexId, 16));
    };

    window.ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      }
    });

    window.ethereum.request({ method: "eth_chainId" }).then((hexId: string) => {
      setChainId(Number.parseInt(hexId, 16));
    });

    window.ethereum.on?.("accountsChanged", handleAccountsChanged);
    window.ethereum.on?.("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  useEffect(() => {
    attachContracts();
  }, [attachContracts]);

  useEffect(() => {
    refreshState();
  }, [refreshState, stakerContract, exampleContract]);

  const connectWallet = useCallback(async () => {
    if (!provider) return;
    const signerAccounts = await provider.send("eth_requestAccounts", []);
    if (signerAccounts.length > 0) {
      setAccount(signerAccounts[0]);
    }
  }, [provider]);

  const submitStake = useCallback(async () => {
    if (!provider || !stakerContract) return;
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const signer = await provider.getSigner();
      const amount = parseEther(stakeInput || "0");
      const tx = await stakerContract.connect(signer).stake({ value: amount });
      setStatusMessage("Submitting stake...");
      await tx.wait();
      setStatusMessage("Stake confirmed");
      await refreshState();
    } catch (error: any) {
      setStatusMessage(error?.shortMessage || error?.message || "Unable to stake");
    } finally {
      setIsLoading(false);
    }
  }, [provider, stakerContract, stakeInput, refreshState]);

  const executeStaking = useCallback(async () => {
    if (!provider || !stakerContract) return;
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const signer = await provider.getSigner();
      const tx = await stakerContract.connect(signer).execute();
      setStatusMessage("Executing staking window...");
      await tx.wait();
      setStatusMessage("Execution complete");
      await refreshState();
    } catch (error: any) {
      setStatusMessage(error?.shortMessage || error?.message || "Execution failed");
    } finally {
      setIsLoading(false);
    }
  }, [provider, stakerContract, refreshState]);

  const withdrawStake = useCallback(async () => {
    if (!provider || !stakerContract) return;
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const signer = await provider.getSigner();
      const tx = await stakerContract.connect(signer).withdraw();
      setStatusMessage("Submitting withdrawal...");
      await tx.wait();
      setStatusMessage("Withdrawal confirmed");
      await refreshState();
    } catch (error: any) {
      setStatusMessage(error?.shortMessage || error?.message || "Withdrawal failed");
    } finally {
      setIsLoading(false);
    }
  }, [provider, stakerContract, refreshState]);

  const canStake = Boolean(account && !completed && timeLeft > 0);
  const canExecute = Boolean(account && timeLeft === 0 && !completed);
  const canWithdraw = Boolean(account && openForWithdraw && userBalance > 0n);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold">Staking Dashboard</h1>
        <p className="text-lg text-slate-300">
          Stake ETH during the countdown, execute the result after the deadline, and withdraw if the threshold is not met.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            onClick={connectWallet}
            className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-600"
          >
            {account ? `Connected: ${account.slice(0, 6)}…${account.slice(-4)}` : "Connect Wallet"}
          </button>
          <button
            onClick={refreshState}
            disabled={!canInteract}
            className="rounded-md border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
          >
            Refresh data
          </button>
          {statusMessage && <span className="text-sm text-emerald-400">{statusMessage}</span>}
        </div>
        {!canInteract && (
          <p className="text-sm text-amber-400">
            Deploy the contracts with <code>yarn deploy --reset</code> in the Hardhat workspace to populate deployment artifacts.
          </p>
        )}
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-6 shadow-lg">
          <h2 className="text-2xl font-semibold">Pool status</h2>
          <dl className="mt-4 space-y-3 text-slate-300">
            <div className="flex items-center justify-between">
              <dt>Total staked</dt>
              <dd className="font-mono">{formatEther(contractBalance)} ETH</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Threshold</dt>
              <dd className="font-mono">{formatEther(threshold)} ETH</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Time left</dt>
              <dd className="font-mono">{timeLeft} s</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Withdrawals open</dt>
              <dd className="font-mono">{openForWithdraw ? "Yes" : "No"}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Pool completed</dt>
              <dd className="font-mono">{completed ? "Yes" : "No"}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-6 shadow-lg">
          <h2 className="text-2xl font-semibold">Your stake</h2>
          <p className="mt-1 text-sm text-slate-400">Balance: {formatEther(userBalance)} ETH</p>
          <label className="mt-4 flex flex-col gap-2 text-sm">
            Stake amount (ETH)
            <input
              value={stakeInput}
              onChange={event => setStakeInput(event.target.value)}
              type="number"
              min="0"
              step="0.01"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-400 focus:outline-none"
            />
          </label>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={submitStake}
              disabled={!canStake || isLoading}
              className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-600"
            >
              Stake
            </button>
            <button
              onClick={executeStaking}
              disabled={!canExecute || isLoading}
              className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-600"
            >
              Execute
            </button>
            <button
              onClick={withdrawStake}
              disabled={!canWithdraw || isLoading}
              className="rounded-md bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:bg-slate-600"
            >
              Withdraw
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Stake events</h2>
          <span className="text-sm text-slate-400">Showing most recent first</span>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {stakeLogs.length === 0 && <p className="text-sm text-slate-500">No stakes yet.</p>}
          {stakeLogs.map(log => (
            <article
              key={log.transactionHash}
              className="flex flex-col gap-1 rounded-md border border-slate-800 bg-slate-950/70 p-4 text-sm"
            >
              <span className="font-mono text-slate-200">{log.staker}</span>
              <span className="text-slate-400">Staked {formatEther(log.amount)} ETH</span>
              <a
                className="text-xs text-indigo-400 hover:underline"
                href={`https://sepolia.etherscan.io/tx/${log.transactionHash}`}
                target="_blank"
                rel="noreferrer"
              >
                View transaction
              </a>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
