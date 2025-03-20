#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  createSolanaRpc,
  address,
  createSolanaRpcSubscriptions,
  sendAndConfirmTransactionFactory,
  pipe,
  setTransactionMessageFeePayer,
  createTransactionMessage,
  createKeyPairSignerFromBytes,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  KeyPairSigner,
  signTransactionMessageWithSigners,
  isSolanaError,
  SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE,
  getSignatureFromTransaction
} from '@solana/kit'
import { getTransferSolInstruction } from '@solana-program/system';
import { readFile } from 'fs/promises'
import path from "path";

const solanaRpc = createSolanaRpc(`https://${process.env.RPC_URL}`);
const solanaRpcSubscription = createSolanaRpcSubscriptions(`wss://${process.env.RPC_URL}`)
const solanaPriceEndpoint = "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=USD"
const PRICE_CACHE_DURATION = 1 * 60 * 1000
let cachedPrice: { value: number; timestamp: number } | null = null;

const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
  rpc: solanaRpc,
  rpcSubscriptions: solanaRpcSubscription,
})


function bigIntReplacer(_key: string, value: any): any {
  return typeof value === 'bigint' ? value.toString() : value;
}

function solToLamports(sol: number): number {
  return sol * 1_000_000_000;
}

function lamportsToSol(lamports: number): number {
  return lamports / 1_000_000_000;
}


async function verifyKeypairFile() {
  if (!process.env.KEYPAIR_PATH) {
    console.error('Error: KEYPAIR_PATH environment variable is not set');
    process.exit(1);
  }

  const keyPairPath = path.join(process.env.KEYPAIR_PATH as string);
  try {
    await readFile(keyPairPath, "utf8");
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.error(`Error: Keypair file not found at ${keyPairPath}`);
    } else if (error.code === 'EACCES') {
      console.error(`Error: Permission denied reading keypair file at ${keyPairPath}`);
    } else {
      console.error(`Error reading keypair file: ${error.message}`);
    }
    process.exit(1);
  }
}

async function loadKeypairFromJson() {
  const keyPairPath = path.join(process.env.KEYPAIR_PATH as string);
  const keypair = JSON.parse(await readFile(keyPairPath, "utf8"));
  return keypair;
}


async function getSolanaPrice() {
  try {
    if (cachedPrice && (Date.now() - cachedPrice.timestamp) < PRICE_CACHE_DURATION) {
      return cachedPrice.value;
    }

    const response = await fetch(solanaPriceEndpoint);
    const data = await response.json();
    
    cachedPrice = {
      value: data.solana.usd,
      timestamp: Date.now()
    };
    
    return cachedPrice.value;
  } catch (error) {
    throw new Error("Failed to get Solana price");
  }
}

async function getSourceAccountSigner() {
  const SOURCE_ACCOUNT_SIGNER = await createKeyPairSignerFromBytes(
    new Uint8Array(await loadKeypairFromJson())
  )
  return SOURCE_ACCOUNT_SIGNER;
}

async function getLatestBlockHash() {
  try {
    const { value: blockHash } = await solanaRpc.getLatestBlockhash().send();
    return blockHash;
  } catch (error) {
    throw new Error("Failed to get latest block hash");
  }
}



async function constructTransactionMessage(
  sourceAccountSigner: KeyPairSigner<string>,
  to: string,
  amount: number
) {
  const blockHash = await getLatestBlockHash();
  const lamportsAmount = solToLamports(amount);
  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx: any) => (
      setTransactionMessageFeePayer(sourceAccountSigner.address, tx)
    ),
    (tx: any) => (
      setTransactionMessageLifetimeUsingBlockhash(blockHash, tx)
    ),
    (tx: any) => (
      appendTransactionMessageInstruction(
        getTransferSolInstruction({
          amount: lamportsAmount,
          source: sourceAccountSigner,
          destination: address(to),
        })
        , tx)
    )
  )
  return transactionMessage;
}

async function signTransactionMessage(transactionMessage: any) {
  try {
    const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
    return signedTransaction;
  } catch (error) {
    throw new Error("Failed to sign transaction message");
  }
}

async function sendTransaction(signedTransaction: any) {
  try {
    const transactionSignature = await sendAndConfirmTransaction(signedTransaction, { commitment: 'confirmed' });
    return transactionSignature;
  } catch (e) {
    if (isSolanaError(e, SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE)) {
      const preflightErrorContext = e.context;
      console.log(preflightErrorContext);
    } else {
      throw e;
    }
  }

}


async function transferTool(args: { to: string, amount: number }) {
  try {
    const sourceAccountSigner = await getSourceAccountSigner()
    const transactionMessage = await constructTransactionMessage(sourceAccountSigner, args.to, args.amount)
    const signedTransaction = await signTransactionMessage(transactionMessage)
    const signature = getSignatureFromTransaction(signedTransaction)
    await sendTransaction(signedTransaction)
    const transaction = await solanaRpc.getTransaction(signature, {
      maxSupportedTransactionVersion: 0
    }).send();
    return transaction;
  } catch (error: any) {
    return error?.message;
  }
}

async function getSlotTool() {
  const slot = await solanaRpc.getSlot().send();
  return slot;
}

async function getAddressBalanceTool(add: string) {
  try {
    const balance = await solanaRpc.getBalance(address(add)).send();
    return balance.value;
  } catch (error: any) {
    return error?.message;
  }
}



// Create an MCP server
const server = new McpServer({
  name: "Solana MCP",
  version: "1.0.0"
});

server.tool(
  "get-latest-slot",
  async () => {
    return {
      content: [{
        type: "text",
        text: String(await getSlotTool())
      }]
    }
  }
)


server.tool(
  "get-wallet-address",
  async () => {
    let address = (await getSourceAccountSigner()).address as string
    return {
      content: [{
        type: "text",
        text: address
      }]
    }
  }
)

server.tool(
  "get-wallet-balance",
  async () => {
    let address = (await getSourceAccountSigner()).address as string
    const lamportsBalance = await getAddressBalanceTool(address)
    const solBalance = lamportsToSol(Number(lamportsBalance))
    const price = await getSolanaPrice()
    const usdBalance = (solBalance * price).toFixed(4)
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          lamportsBalance: lamportsBalance,
          solanaBalnce: solBalance,
          usdBalance: usdBalance
        }, bigIntReplacer, 2)
      }]
    }
  }
)

server.tool("transfer",
  {
    to: z.string().describe("Recipient wallet address"),
    amount: z.number().describe("Amount in SOL")
  },
  async (args) => {
    const transaction = await transferTool(args);
    return {
      content: [{ type: "text", text: JSON.stringify(transaction, bigIntReplacer, 2) }]
    }
  }
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();

async function main() {
  await verifyKeypairFile();
  await server.connect(transport);
  console.log("Server connected");
}

main().catch(console.error);
