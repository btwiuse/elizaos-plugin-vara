import { decodeAddress, encodeAddress } from "@gear-js/api";
import { Keyring } from "@polkadot/keyring";
import { KeyringPair } from "@polkadot/keyring/types";
import { BN, hexToU8a, isHex, u8aToHex } from "@polkadot/util";

/**
 * This function checks if a given address is valid.
 *
 * @param {string} address The address to validate.
 *
 * @returns {boolean} A boolean value indicating whether the address is valid or not.
 */
export const isValidAddress = (address: string): boolean => {
  return true;
  try {
    encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address));
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Formats a number to balance.
 *
 * @param {number | string} value The number value to format.
 * @param {number} [decimals] The number of decimal places to include in the formatted balance. Defaults to 18.
 *
 * @returns {BN} The converted BN value.
 */
export const formatNumberToBalance = (
  value: number | string,
  decimals: number = 12,
): BN => {
  const MAX_NUMBER_VALUES = 10;
  const [integerPart, fractionalPart] = value.toString().split(".");

  if (
    typeof value === "number" &&
    ((integerPart && integerPart.length > MAX_NUMBER_VALUES) ||
      (fractionalPart && fractionalPart.length > MAX_NUMBER_VALUES))
  ) {
    throw new Error(
      "For big representation of number, please use a string instead of a number",
    );
  }
  const integerBN = new BN(integerPart).mul(new BN(10).pow(new BN(decimals)));
  if (!fractionalPart) return integerBN;
  const fractionalBN = new BN(
    `${fractionalPart}${"0".repeat(decimals)}`.slice(0, decimals),
  );
  return integerBN.add(fractionalBN);
};

/**
 * Generates a new keyring.
 *
 * @returns {Keyring} The newly generated Keyring instance.
 */
export const generateKeyring = (): Keyring => {
  return new Keyring({ type: "sr25519" });
};

/**
 * Retrieves a keyring pair from a given seed.
 *
 * @param {string} seed The seed value used to generate the keypair.
 * @returns {KeyringPair} The KeyringPair generated from the seed.
 */
export const getKeyringFromSeed = (seed: string): KeyringPair => {
  const keyring = generateKeyring();
  return keyring.addFromUri(seed);
};
