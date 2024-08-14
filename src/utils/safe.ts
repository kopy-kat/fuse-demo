import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  ENTRYPOINT_ADDRESS_V07,
  createSmartAccountClient,
} from "permissionless";
import { signerToSafeSmartAccount } from "permissionless/accounts";
import {
  createPimlicoBundlerClient,
  createPimlicoPaymasterClient,
} from "permissionless/clients/pimlico";
import { createPublicClient, getContract, http, parseEther } from "viem";
import { fuseSparknet } from "viem/chains";
import { erc7579Actions } from "permissionless/actions/erc7579";
import { pimlicoPaymasterActions } from "permissionless/actions/pimlico";

const apiKey = process.env.NEXT_PUBLIC_API_KEY!;

const pimlicoUrl = `https://api.pimlico.io/v2/fuse-sparknet/rpc?apikey=${apiKey}`;
const safe4337ModuleAddress = "0x27b102239a4082fcc1b4e9abe2349fa88156f78b";
const erc7579LaunchpadAddress = "0xdfc1999aa9a0af2e8670099c8e80cd4c6e1da259";
const safeSingletonAddress = "0xc7a5a28849d7309d7e97ae398c798a9c82db4138";
const safeProxyFactoryAddress = "0x4340Fc630a69508F9aAc5DbF6da48f9603C4a222";
const multiSendAddress = "0x3e68939EB7a5eF1bfac22Cd465F41E66b44FB08E";

const privateKey = generatePrivateKey();
const signer = privateKeyToAccount(privateKey);

const publicClient = createPublicClient({
  transport: http("https://rpc.fusespark.io"),
});

const pimlicoBundlerClient = createPimlicoBundlerClient({
  transport: http(pimlicoUrl),
  entryPoint: ENTRYPOINT_ADDRESS_V07,
}).extend(pimlicoPaymasterActions(ENTRYPOINT_ADDRESS_V07));

export const getSmartAccountClient = async () => {
  const account = await signerToSafeSmartAccount(publicClient, {
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    signer,
    safeVersion: "1.4.1",
    saltNonce: 120n,
    safe4337ModuleAddress,
    erc7579LaunchpadAddress,
    safeSingletonAddress,
    safeProxyFactoryAddress,
  });

  //   const smartAccountClient = createSmartAccountClient({
  //     chain: fuseSparknet,
  //     account,
  //     bundlerTransport: http(pimlicoUrl),
  //     middleware: {
  //       gasPrice: async () => {
  //         return (await bundlerClient.getUserOperationGasPrice()).standard;
  //       },
  //       sponsorUserOperation: paymasterClient.sponsorUserOperation,
  //     },
  //   }).extend(erc7579Actions({ entryPoint: ENTRYPOINT_ADDRESS_V07 }));

  const smartAccountClient = createSmartAccountClient({
    account,
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    chain: fuseSparknet,
    bundlerTransport: http(pimlicoUrl),
    middleware: {
      gasPrice: async () => {
        return (await pimlicoBundlerClient.getUserOperationGasPrice()).fast;
      },
      sponsorUserOperation: pimlicoBundlerClient.sponsorUserOperation,
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
  const opHash = await safeAccount.sendTransaction({
    to: "0x7Ceabc27B1dc6A065fAD85A86AFBaF97F7692088",
    value: 0n,
  });
  console.log(`Transaction sent: ${opHash}`);
};
