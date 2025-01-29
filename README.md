# @elizaos/plugin-vara - Plugin for Vara

This is a plugin for using Eliza to interact with the Vara network. Defaults
to the Vara mainnet, but can be customized to use other networks by changing
the RPC in the `.env` file at `VARA_RPC_URL`.

## Actions

- **transfer**: This action enables the transfer of VARA tokens from the agent's
  wallet (as defined by the keyring generated from `VARA_SEED`) to another
  wallet. To use, just mention the transfer of VARA tokens to a Vara account.

  - name: `SEND_VARA`

  - Message sample:
    `Send 1 VARA to 5GWbvXjefEvXXETtKQH7YBsUaPc379KAQATW1eqeJT26cbsK`

## Usage & Testing

### Detailed testing steps

- In `.env` you should set the value for `VARA_ADDRESS` (this is the public
  address for the agent account -
  [learn how to get one here](https://vara.network/docs/learn-account-generation))
  and `VARA_SEED` (seed phrase for the same account).

- **Transfer VARA**
  - To test the transfer function, you need tokens in your Vara account. You
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
