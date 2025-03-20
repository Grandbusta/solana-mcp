# Solana MCP Server 🌱

A MCP server to interact with the Solana blockchain with your own private key.

## 📖 Table of Contents
- [✨Features](#-features)
- [⚙️Setup](#️-setup)
- [Integration with Cursor](#integration-with-cursor)
- [🛠️Available Tools](#️available-tools)
- [🔖License](#️license)

## ✨ Features

- Get latest slot
- Get wallet address
- Get wallet balance
- Transfer SOL

## ⚙️ Setup

1. Clone the repository
```bash
git clone https://github.com/Grandbusta/solana-mcp.git
```

2. Install dependencies
```bash
npm install
```

3. Build the project
```bash
npm run build
```

4. Create a keypair file
Create a file named `keypair.json` anywhere you want and copy your private key into it. Check the example-keypair.json file for an example.


## Integration with Cursor

To integrate with Cursor, follow these steps:

1. In the Cursor settings, go to MCP
2. Click "Add new MCP server"
3. Enter the following information:
   - Name: Solana MCP
   - Type: command
   - Command: ```/path/to/your/solana-mcp/run.sh /path/to/your/keypair.json```

Example command: ```/Users/username/projects/solana-mcp/run.sh /Users/username/Documents/keypair.json```


## 🛠️Available Tools

### get-latest-slot
Returns the latest slot number:

```bash
368202671
```

### get-wallet-address
Returns the wallet address:

```bash
5GTuMBag1M8tfe736kcV1vcAE734Zf1SRta8pmWf82TJ
```

### get-wallet-balance
Returns the wallet balance in SOL, Lamports, and USD:

```bash
{
  "lamportsBalance": "4179966000",
  "solanaBalnce": 4.179966,
  "usdBalance": "553.0513"
}
```

### transfer
Transfers SOL to a recipient address:

```bash
{
  "blockTime": "1742316463",
  "meta": {
    "computeUnitsConsumed": "150",
    "err": null,
    "fee": "5000",
    "innerInstructions": [],
    "loadedAddresses": {
      "readonly": [],
      "writable": []
    },
    "logMessages": [
      "Program 11111111111111111111111111111111 invoke [1]",
      "Program 11111111111111111111111111111111 success"
    ],
    "postBalances": [
      "4179966000",
      "819999000",
      "1"
    ],
    "postTokenBalances": [],
    "preBalances": [
      "4399970000",
      "600000000",
      "1"
    ],
    "preTokenBalances": [],
    "rewards": [],
    "status": {
      "Ok": null
    }
  },
  "slot": "368211978",
  "transaction": {
    "message": {
      "accountKeys": [
        "6qhddtBoEHqTc3VM35a3rb3aLUe6vDQfmLigo2G4r5s1",
        "5GTuMBag1M8tfe736kcV1vcAE734Zf1SRta8pmWf82TJ",
        "11111111111111111111111111111111"
      ],
      "addressTableLookups": [],
      "header": {
        "numReadonlySignedAccounts": 0,
        "numReadonlyUnsignedAccounts": 1,
        "numRequiredSignatures": 1
      },
      "instructions": [
        {
          "accounts": [
            0,
            1
          ],
          "data": "3Bxs452Q9hdvHuwd",
          "programIdIndex": 2,
          "stackHeight": null
        }
      ],
      "recentBlockhash": "BLqtPS9BHPp9CRFTrVAsrxFMWC98VTUAQ3vi12bSquLo"
    },
    "signatures": [
      "3bLyqbPn26ofkaxSAVqadQnHqXu9hyoryixmKCn69nunKg2cSryDVAWnfCcYPcGtjSmXcMHfrzc3bw25zFTabXvs"
    ]
  },
  "version": "0"
}
```


## 🧑‍💻 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 🔖License

[WTFPL License](https://www.wtfpl.net/about/)