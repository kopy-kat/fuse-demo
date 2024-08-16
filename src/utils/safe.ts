import { privateKeyToAccount } from "viem/accounts";
import {
  ENTRYPOINT_ADDRESS_V07,
  createSmartAccountClient,
  getAccountNonce,
} from "permissionless";
import { signerToSafeSmartAccount } from "permissionless/accounts";
import { createPimlicoBundlerClient } from "permissionless/clients/pimlico";
import { Address, createPublicClient, http, pad, PublicClient } from "viem";
import { fuseSparknet } from "viem/chains";
import { erc7579Actions } from "permissionless/actions/erc7579";
import { pimlicoPaymasterActions } from "permissionless/actions/pimlico";

const apiKey = process.env.NEXT_PUBLIC_API_KEY!;

const pimlicoUrl = `https://api.pimlico.io/v2/fuse-sparknet/rpc?apikey=${apiKey}`;
const safe4337ModuleAddress = "0x27b102239a4082fcc1b4e9abe2349fa88156f78b";
const erc7579LaunchpadAddress = "0xdfc1999aa9a0af2e8670099c8e80cd4c6e1da259";
const safeSingletonAddress = "0xc7a5a28849d7309d7e97ae398c798a9c82db4138";
const safeProxyFactoryAddress = "0x4340Fc630a69508F9aAc5DbF6da48f9603C4a222";

const privateKey =
  "0x9c203f0d48189d0c1a57a556f0a09fd07d7464ea15a9d3c4bcc545204724a36e";
const signer = privateKeyToAccount(privateKey);

const publicClient = createPublicClient({
  transport: http("https://rpc.fusespark.io", { timeout: 100_000 }),
});

const pimlicoBundlerClient = createPimlicoBundlerClient({
  transport: http(pimlicoUrl, { timeout: 100_000 }),
  entryPoint: ENTRYPOINT_ADDRESS_V07,
}).extend(pimlicoPaymasterActions(ENTRYPOINT_ADDRESS_V07));

export const getSmartAccountClient = async () => {
  const account = await signerToSafeSmartAccount(publicClient, {
    signer,
    safeVersion: "1.4.1",
    saltNonce: 120n,
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    safe4337ModuleAddress,
    safeProxyFactoryAddress,
    safeSingletonAddress,
    erc7579LaunchpadAddress,
    validators: [
      { address: "0x7126A84987a5EF2E406e13F73655D4b89EcCF686", context: "0x" },
    ],
  });

  const smartAccountClient = createSmartAccountClient({
    account,
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    chain: fuseSparknet,
    bundlerTransport: http(pimlicoUrl),
    middleware: {
      gasPrice: async () => {
        return (await pimlicoBundlerClient.getUserOperationGasPrice()).fast;
      },
    },
  }).extend(erc7579Actions({ entryPoint: ENTRYPOINT_ADDRESS_V07 }));

  console.log(
    `Smart account address: https://explorer.fusespark.io/address/${smartAccountClient.account.address}`
  );
  return smartAccountClient as SafeSmartAccountClient;
};

export const testFlow = async () => {
  console.log("API_KEY", apiKey);

  console.log("starting...");
  const safeAccount = await getSmartAccountClient();
  console.log("safeAccount", safeAccount);
  const accountId = await safeAccount.accountId();
  console.log("accountId", accountId);
  const opHash = await safeAccount.sendTransactions({
    transactions: [
      {
        to: "0x7Ceabc27B1dc6A065fAD85A86AFBaF97F7692088",
        value: 0n,
      },
    ],
    nonce: await getNonce({
      publicClient,
      account: safeAccount.account.address,
    }),
  });
  console.log(`Transaction sent: ${opHash}`);
};

export const getNonce = async ({
  publicClient,
  account,
}: {
  publicClient: PublicClient;
  account: Address;
}) => {
  return await getAccountNonce(publicClient, {
    sender: account,
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    key: BigInt(
      pad("0x7126A84987a5EF2E406e13F73655D4b89EcCF686", {
        dir: "right",
        size: 24,
      })
    ),
  });
};
