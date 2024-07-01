import {
    AccountUpdate,
    assert,
    Bool,
    DeployArgs,
    method,
    Mina,
    PrivateKey,
    Provable,
    PublicKey,
    SmartContract,
    State,
    state,
    UInt64,
    UInt8,
  } from "o1js"
import { FungibleToken, FungibleTokenAdminDeployProps } from "./ft-standard/index.js";
import { PausableAdmin } from "./PausableAdmin.js";
import { NonPausableAdmin } from "./NonPausableAdmin.js";

/**
 * Set options at the top of the file to determine deploy config
 * 
 * These config settings will eventually be set in a CLI instead.
 */
const pausable = true;

// Simple ternary until more variation is added
const adminClass = pausable ? PausableAdmin : NonPausableAdmin;

const localChain = await Mina.LocalBlockchain({
    proofsEnabled: false,
    enforceTransactionLimits: true,
  })
  Mina.setActiveInstance(localChain)
  
  const fee = 1e8
  
  const [deployer, owner, alexa, billy] = localChain.testAccounts;
  const contract = PrivateKey.randomKeypair()
  const admin = PrivateKey.randomKeypair()
  
  const token = new FungibleToken(contract.publicKey)
  const adminContract = new adminClass(admin.publicKey)
  
  console.log("Deploying token contract.")
  const deployTx = await Mina.transaction({
    sender: deployer,
    fee,
  }, async () => {
    AccountUpdate.fundNewAccount(deployer, 2)
    await adminContract.deploy({ adminPublicKey: admin.publicKey })
    await token.deploy({
      admin: admin.publicKey,
      symbol: "abc",
      src: "https://github.com/MinaFoundation/mina-fungible-token/blob/main/examples/e2e.eg.ts",
      decimals: UInt8.from(9),
    })
  })
  await deployTx.prove()
  deployTx.sign([deployer.key, contract.privateKey, admin.privateKey])
  const deployTxResult = await deployTx.send().then((v) => v.wait())
//   console.log("Deploy tx result:", deployTxResult.toPretty())
  
  const alexaBalanceBeforeMint = (await token.getBalanceOf(alexa)).toBigInt()
  console.log("Alexa balance before mint:", alexaBalanceBeforeMint)
  
  console.log("Minting new tokens to Alexa.")
  const mintTx = await Mina.transaction({
    sender: owner,
    fee,
  }, async () => {
    AccountUpdate.fundNewAccount(owner, 1)
    await token.mint(alexa, new UInt64(2e9))
  })
  await mintTx.prove()
  mintTx.sign([owner.key, admin.privateKey])
  const mintTxResult = await mintTx.send().then((v) => v.wait())
//   console.log("Mint tx result:", mintTxResult.toPretty())
  
  const alexaBalanceAfterMint = (await token.getBalanceOf(alexa)).toBigInt()
  console.log("Alexa balance after mint:", alexaBalanceAfterMint)
  
  const billyBalanceBeforeMint = await token.getBalanceOf(billy)
  console.log("Billy balance before mint:", billyBalanceBeforeMint.toBigInt())
  
  console.log("Transferring tokens from Alexa to Billy")
  const transferTx = await Mina.transaction({
    sender: alexa,
    fee,
  }, async () => {
    AccountUpdate.fundNewAccount(alexa, 1)
    await token.transfer(alexa, billy, new UInt64(1e9))
  })
  await transferTx.prove()
  transferTx.sign([alexa.key])
  const transferTxResult = await transferTx.send().then((v) => v.wait())
//   console.log("Transfer tx result:", transferTxResult.toPretty())
  
  const alexaBalanceAfterTransfer = (await token.getBalanceOf(alexa)).toBigInt()
  const billyBalanceAfterTransfer = (await token.getBalanceOf(billy)).toBigInt()
  console.log("Alexa balance after transfer:", alexaBalanceAfterTransfer)
  console.log("Billy balance after transfer:", billyBalanceAfterTransfer)
