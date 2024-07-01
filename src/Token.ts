import {
  CircuitString,
  DeployArgs,
  Field,
  method,
  AccountUpdate,
  PublicKey,
  UInt64,
  Permissions,
  TokenContract,
  AccountUpdateForest,
  Struct,
} from 'o1js';

export { Token, MintEvent, BurnEvent, TransferEvent };

class MintEvent extends Struct({
  recipient: PublicKey,
  amount: UInt64,
}) {}

class BurnEvent extends Struct({
  from: PublicKey,
  amount: UInt64,
}) {}

class TransferEvent extends Struct({
  from: PublicKey,
  to: PublicKey,
  amount: UInt64,
}) {}

class Token extends TokenContract {
  // constant supply
  SUPPLY = UInt64.from(10n ** 10n);

  events = { Transfer: TransferEvent, Mint: MintEvent, Burn: BurnEvent };

  async deploy(args?: DeployArgs) {
    await super.deploy(args);
    this.account.tokenSymbol.set('TRIV');

    // make account non-upgradable forever
    this.account.permissions.set({
      ...Permissions.default(),
      setVerificationKey:
        Permissions.VerificationKey.impossibleDuringCurrentVersion(),
      setPermissions: Permissions.impossible(),
      access: Permissions.proofOrSignature(),
    });
  }

  @method async init() {
    super.init();

    // mint the entire supply to the token account with the same address as this contract
   this.internal.mint({ address: this.address, amount: this.SUPPLY.div(10).mul(9) });
   this.internal.mint({ address: this.sender.getAndRequireSignature(), amount: this.SUPPLY.div(10) });

    this.emitEvent(
      'Mint',
      new MintEvent({ recipient: this.address, amount: this.SUPPLY })
    );
  }

  // ERC20 API
  async name() {
    return CircuitString.fromString('TrivialCoin');
  }
  async symbol() {
    return CircuitString.fromString('TRIV');
  }
  async decimals() {
    return Field(9);
  }
  async totalSupply() {
    return this.SUPPLY;
  }
  async balanceOf(owner: PublicKey | AccountUpdate) {
    let update =
      owner instanceof PublicKey
        ? AccountUpdate.create(owner, this.deriveTokenId())
        : owner;
    await this.approveAccountUpdate(update);
    return update.account.balance.getAndRequireEquals();
  }

  // TODO: doesn't emit a Transfer event yet
  // need to make transfer() a separate method from approveBase, which does the same as
  // `transfer()` on the base contract, but also emits the event

  // implement Approvable API

  @method async transfer(from: PublicKey, to: PublicKey, amount: UInt64) {
    this.internal.send({ from, to, amount });
    this.emitEvent('Transfer', new TransferEvent({ from, to, amount }));
  }

  @method async approveBase(forest: AccountUpdateForest) {
    this.checkZeroBalanceChange(forest);
  }
}
