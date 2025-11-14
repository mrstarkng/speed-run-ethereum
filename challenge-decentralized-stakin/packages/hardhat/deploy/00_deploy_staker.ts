import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { ethers, artifacts, network } from "hardhat";

type ContractExport = {
  address: string;
  abi: any[];
};

type DeploymentMap = Record<number, Record<string, ContractExport>>;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with ${deployer.address}`);

  const exampleExternalFactory = await ethers.getContractFactory("ExampleExternalContract");
  const exampleExternal = await exampleExternalFactory.deploy();
  await exampleExternal.waitForDeployment();
  console.log(`ExampleExternalContract deployed at ${exampleExternal.target}`);

  const stakerFactory = await ethers.getContractFactory("Staker");
  const staker = await stakerFactory.deploy(exampleExternal.target);
  await staker.waitForDeployment();
  console.log(`Staker deployed at ${staker.target}`);

  const chainId = Number(await network.provider.send("eth_chainId"));

  const exampleArtifact = await artifacts.readArtifact("ExampleExternalContract");
  const stakerArtifact = await artifacts.readArtifact("Staker");

  const deployments: DeploymentMap = {
    [chainId]: {
      ExampleExternalContract: {
        address: exampleExternal.target as string,
        abi: exampleArtifact.abi,
      },
      Staker: {
        address: staker.target as string,
        abi: stakerArtifact.abi,
      },
    },
  };

  const targetDir = join(__dirname, "..", "..", "nextjs", "contracts");
  mkdirSync(targetDir, { recursive: true });
  const targetFile = join(targetDir, "deployedContracts.ts");
  const fileContents = `export const deployedContracts = ${JSON.stringify(deployments, null, 2)} as const;\n`;
  writeFileSync(targetFile, fileContents);
  console.log(`Wrote deployment data to ${targetFile}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
