# @elizaos/plugin-polkadot - Plugin for Polkadot

This is a plugin for using Eliza to interact with the Polkadot network. Defaults
to the Polkadot mainnet, but can be customized to use other networks by changing
the RPC in the `.env` file at `POLKADOT_RPC_URL`.

## Actions

- **transfer**: This action enables the transfer of DOT tokens from the agent's
  wallet (as defined by the keyring generated from `POLKADOT_SEED`) to another
  wallet. To use, just mention the transfer of DOT tokens to a Polkadot account.

  - name: `SEND_POLKADOT`

  - Message sample:
    `Send 100 DOT to 5GWbvXjefEvXXETtKQH7YBsUaPc379KAQATW1eqeJT26cbsK`

## Usage & Testing

### Detailed testing steps

- In `.env` you should set the value for `POLKADOT_ADDRESS` (this is the public
  address for the agent account -
  [learn how to get one here](https://wiki.polkadot.network/docs/learn-account-generation))
  and `POLKADOT_SEED` (seed phrase for the same account).

- **Transfer DOT**
  - To test the transfer function, you need tokens in your Polkadot account. You
    can acquire DOT tokens from various exchanges or use the Polkadot Faucet for
    testnet tokens.
  - Run the agent and prompt it with: "send <AMOUNT> DOT to
    <any other Polkadot account> " - e.g.
    `send 1 DOT to 5GWbvXjefEvXXETtKQH7YBsUaPc379KAQATW1eqeJT26cbsK`
  - Assuming everything goes smoothly, the agent returns with the Tx Hash and
    Block Hash. The tx hash can be checked on the Polkadot block explorer at
    https://polkadot.subscan.io/

## Resources

- [Polkadot Documentation](https://wiki.polkadot.network/)
- [Set up a Polkadot Account](https://wiki.polkadot.network/docs/learn-account-generation) -
  Learn how to get your `POLKADOT_SEED`
- [Find more Network Information like RPC endpoints](https://wiki.polkadot.network/docs/maintain-networks)
- [Learn more about Polkadot](https://polkadot.network/)
