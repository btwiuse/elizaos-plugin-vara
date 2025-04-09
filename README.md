# @elizacn/plugin-vara - Plugin for Vara

This is a plugin for using Eliza to interact with the Vara network. Defaults
to the Vara mainnet, but can be customized to use other networks by changing
the RPC in the `.env` file at `VARA_RPC_URL`.

## Actions

- **AIRDROP**: This action enables the transfer of VARA tokens from the agent's
  wallet (as defined by the keyring generated from `VARA_SEED`) to another
  wallet. To use, just mention the airdrop of VARA tokens to a Vara account.

  - name: `AIRDROP`

  - Message sample:
    `Airdrop 1 VARA to 5GWbvXjefEvXXETtKQH7YBsUaPc379KAQATW1eqeJT26cbsK`

  Note: this action should only be used for testnet accounts, as it will
  transfer real VARA tokens from the agent's wallet to the specified account.

- **WALLET_CONNECT**: This action initializes a connection to user's wallet
  via WalletConnect. It will show the pairing uri in the chat, which the user
  is expected to scan with their wallet app. After scanning, the user will
  be prompted to approve the connection. Once approved, the agent will get
  user's wallet address and will be able to send transactions on behalf of
  the user.

  - name: `WALLET_CONNECT`

  - Message sample:
    `Please connect my wallet`

  Note: for now the user is expected to convert the uri to a QR code.

- **SIGN_MESSAGE**: This action allows the user to sign a message with their
  wallet via the existing walletConnect session. The agent will prompt the 
  user to sign a message, and once signed, the agent will return the signature.

  - name: `SIGN_MESSAGE`

  - Message sample:
   `Please sign this message: "Hello, world!"`

  Note: this action requires the user to have their wallet connected via
  WalletConnect.

- **SIGN_TRANSFER_TRANSACTION**: This action allows the user to sign a token transfer
  transaction with their wallet via the existing walletConnect session. The agent 
  will prompt the user to sign a message, and once signed, the agent will return 
  the signature with the signed payload.

  - name: `SIGN_TRANSFER_TRANSACTION`

  - Message sample:
   `Please send 1 VARA to 5GWbvXjefEvXXETtKQH7YBsUaPc379KAQATW1eqeJT26cbsK from my connected wallet`

  Note: this action requires the user to have their wallet connected via
  WalletConnect.

## Usage & Testing

Example .env file:

```bash
OPENAI_BASE_URL="https://api.openai.com/v1"
OPENAI_API_KEY=sk-*
EXAMPLE_PLUGIN_VARIABLE=foo
VARA_RPC_URL=wss://testnet.vara.network
VARA_SEED=//Alice
VARA_ADDRESS=5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
# vara mainnet
# CHAIN_CAIP=polkadot:fe1b4c55fd4d668101126434206571a7
# vara testnet
CHAIN_CAIP=polkadot:525639f713f397dcf839bd022cd821f3
```

Note that currently Nova Wallet only supports Vara mainnet, so if you want to test
the plugin with the testnet, you need to use other wallet apps.

### Detailed testing steps

- In `.env` you should set the value for `VARA_ADDRESS` (this is the public
  address for the agent account -
  [learn how to get one here](https://vara.network/docs/learn-account-generation))
  and `VARA_SEED` (seed phrase for the same account).

- **Airdrop VARA**
  - To test the airdrop function, you need tokens in your Vara account. You
    can acquire VARA tokens from various exchanges or use the Vara Faucet for
    testnet tokens.
  - Run the agent and prompt it with: "send <AMOUNT> VARA to
    <any other Vara account> " - e.g.
    `send 1 VARA to 5GWbvXjefEvXXETtKQH7YBsUaPc379KAQATW1eqeJT26cbsK`
  - Assuming everything goes smoothly, the agent returns with the Tx Hash and
    Block Hash. The tx hash can be checked on the Vara block explorer at
    https://vara.subscan.io/

## Resources

- [Vara Documentation](https://vara.network/)
- [Set up a Vara Account](https://vara.network/docs/learn-account-generation) -
  Learn how to get your `VARA_SEED`
- [Find more Network Information like RPC endpoints](https://vara.network/docs/maintain-networks)
- [Learn more about Vara](https://vara.network/)
