import { createPublicClient, createWalletClient, custom, http, defineChain, parseEther, formatEther, decodeEventLog, type Address } from "viem";

export const RITUAL_CHAIN = defineChain({
  id: 1979,
  name: "Ritual",
  nativeCurrency: { name: "Ritual", symbol: "RITUAL", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.ritualfoundation.org/"] } },
  blockExplorers: { default: { name: "Explorer", url: "https://explorer.ritualfoundation.org/" } },
});

export const CONTRACT_ADDRESS = "0x205336D124145881e00dad29aAA9669F739684B2" as const;
export const DEPLOY_BLOCK = 25286727n;
// Leaderboard reset: only events at or after this Unix timestamp are shown.
// Bump this to wipe the visible leaderboard without redeploying.
export const LEADERBOARD_RESET_AT = 1779235200; // 2026-05-30 UTC — bumped to wipe board
// Encoding: on-chain `score` arg = realScore * SCORE_ENCODE_BASE + questionsAnswered
export const SCORE_ENCODE_BASE = 100000;
export const MAX_QUESTIONS_ENCODE = SCORE_ENCODE_BASE - 1;
export const FEE_WEI = parseEther("0.0002");
export const QUIZ_ABI = [
  { type: "function", name: "FEE", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    type: "function",
    name: "startGame",
    stateMutability: "payable",
    inputs: [{ name: "discord", type: "string" }],
    outputs: [],
  },
  {
    type: "function",
    name: "submitScore",
    stateMutability: "nonpayable",
    inputs: [
      { name: "discord", type: "string" },
      { name: "score", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "GameStarted",
    inputs: [
      { indexed: true, name: "player", type: "address" },
      { indexed: false, name: "discord", type: "string" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "ScoreSubmitted",
    inputs: [
      { indexed: true, name: "player", type: "address" },
      { indexed: false, name: "discord", type: "string" },
      { indexed: false, name: "score", type: "uint256" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
  },
] as const;

export const publicClient = createPublicClient({
  chain: RITUAL_CHAIN,
  transport: http(),
});

export function getWalletClient() {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("No wallet detected. Install MetaMask.");
  }
  return createWalletClient({
    chain: RITUAL_CHAIN,
    transport: custom((window as any).ethereum),
  });
}

export async function ensureRitualChain() {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("No wallet");
  const hexId = "0x" + (1979).toString(16);
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexId }] });
  } catch (err: any) {
    if (err?.code === 4902 || err?.code === -32603) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: hexId,
          chainName: "Ritual",
          rpcUrls: ["https://rpc.ritualfoundation.org/"],
          nativeCurrency: { name: "Ritual", symbol: "RITUAL", decimals: 18 },
          blockExplorers: [{ name: "Explorer", url: "https://explorer.ritualfoundation.org/" }],
        }],
      });
    } else {
      throw err;
    }
  }
}

export async function connectWallet(): Promise<Address> {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("No wallet. Install MetaMask.");
  const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
  await ensureRitualChain();
export type ScoreEntry = {
  player: string;
  discord: string;
  score: number;
  questions: number;
  timestamp: number;
  txHash: string;
};

const RITUAL_AVG_BLOCK_SEC = 2; // approximate

async function getFromBlockForWindow(seconds: number): Promise<bigint> {
  const latest = await publicClient.getBlockNumber();
  const back = BigInt(Math.ceil(seconds / RITUAL_AVG_BLOCK_SEC));
  const candidate = latest > back ? latest - back : 0n;
  return candidate < DEPLOY_BLOCK ? DEPLOY_BLOCK : candidate;
}

export function encodeScore(realScore: number, questions: number): bigint {
  const q = Math.max(0, Math.min(MAX_QUESTIONS_ENCODE, Math.floor(questions)));
  return BigInt(Math.floor(realScore)) * BigInt(SCORE_ENCODE_BASE) + BigInt(q);
}

export function decodeScore(encoded: number): { score: number; questions: number } {
  return {
    score: Math.floor(encoded / SCORE_ENCODE_BASE),
    questions: encoded % SCORE_ENCODE_BASE,
  };
}

export async function fetchScores(windowSeconds: number): Promise<ScoreEntry[]> {
  const fromBlock = await getFromBlockForWindow(windowSeconds);
  const logs = await publicClient.getLogs({
    address: CONTRACT_ADDRESS,
    event: {
      type: "event",
      name: "ScoreSubmitted",
      inputs: [
        { indexed: true, name: "player", type: "address" },
        { indexed: false, name: "discord", type: "string" },
        { indexed: false, name: "score", type: "uint256" },
        { indexed: false, name: "timestamp", type: "uint256" },
      ],
    },
    fromBlock,
    toBlock: "latest",
  });
  const windowCutoff = Math.floor(Date.now() / 1000) - windowSeconds;
  const cutoff = Math.max(windowCutoff, LEADERBOARD_RESET_AT);
  const all: ScoreEntry[] = logs.map((l) => {
    const args = l.args as any;
    const encoded = Number(args.score);
    const { score, questions } = decodeScore(encoded);
    return {
      player: args.player as string,
      discord: args.discord as string,
      score,
      questions,
      timestamp: Number(args.timestamp),
      txHash: l.transactionHash!,
    };
  }).filter((e) => e.timestamp >= cutoff);

  all.sort((a, b) => a.timestamp - b.timestamp);
  const map = new Map<string, ScoreEntry>();
  for (const e of all) {
    map.set(e.discord.toLowerCase(), e);
  }
  return [...map.values()].sort((a, b) => b.score - a.score).slice(0, 50);
}
  }
  return [...map.values()].sort((a, b) => b.score - a.score).slice(0, 50);
}

export { formatEther, parseEther };
