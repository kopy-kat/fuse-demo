const pimlicoUrl = `https://api.pimlico.io/v2/fuse-sparknet/rpc?apikey=${apiKey}`;
const safe4337ModuleAddress = "0x27b102239a4082fcc1b4e9abe2349fa88156f78b";
const erc7569LaunchpadAddress = "0xdfc1999aa9a0af2e8670099c8e80cd4c6e1da259";
const safeSingletonAddress = "0xc7a5a28849d7309d7e97ae398c798a9c82db4138";
const safeProxyFactoryAddress = "0x4340fc630a69508f9aac5dbf6da48f9603c4a222";

const signer = privateKeyToAccount(privateKey);

const publicClient = createPublicClient({
  transport: http("https://rpc.fusespark.io"),
});

const paymasterClient = createPimlicoPaymasterClient({
  transport: http(pimlicoUrl),
  entryPoint: ENTRYPOINT_ADDRESS_V07,
});

const bundlerClient = createPimlicoBundlerClient({
  transport: http(pimlicoUrl),
  entryPoint: ENTRYPOINT_ADDRESS_V07,
});

export const getSmartAccountClient = async () => {
  const account = await signerToSafeSmartAccount(publicClient, {
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    signer,
    safeVersion: "1.4.1",
    saltNonce: 120n,
    safe4337ModuleAddress,
    erc7569LaunchpadAddress,
    safeSingletonAddress,
    safeProxyFactoryAddress,
  });

  const smartAccountClient = createSmartAccountClient({
    chain: fuseSparknet,
    account,
    bundlerTransport: http(pimlicoUrl),
    middleware: {
      gasPrice: async () => {
        return (await bundlerClient.getUserOperationGasPrice()).standard;
      },
      sponsorUserOperation: paymasterClient.sponsorUserOperation,
    },
  }).extend(erc7579Actions({ entryPoint: ENTRYPOINT_ADDRESS_V07 }));

  console.log(
    `Smart account address: https://explorer.fusespark.io/address/${smartAccountClient.account.address}`
  );
  return smartAccountClient as SafeSmartAccountClient;
};

const safeAccount = await getSmartAccountClient();

export const sendTransaction = async () => {
  const opHash = await safeAccount.sendTransaction({
    to: "0x7Ceabc27B1dc6A065fAD85A86AFBaF97F7692088",
    value: 0n,
  });
  console.log(`Transaction sent: ${opHash}`);
};
