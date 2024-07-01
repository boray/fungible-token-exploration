import {
    AccountUpdate,
    assert,
    Bool,
    method,
    Provable,
    PublicKey,
    SmartContract,
    State,
    state,
} from "o1js"

import { FungibleTokenAdminBase, FungibleTokenAdminDeployProps } from "./ft-standard";

export class NonPausableAdmin extends SmartContract implements FungibleTokenAdminBase {
    @state(PublicKey)
    private adminPublicKey = State<PublicKey>()

    async deploy(props: FungibleTokenAdminDeployProps) {
        await super.deploy(props)
        this.adminPublicKey.set(props.adminPublicKey)
    }

    private async ensureAdminSignature() {
        const admin = await Provable.witnessAsync(PublicKey, async () => {
            let pk = await this.adminPublicKey.fetch()
            assert(pk !== undefined, "could not fetch admin public key")
            return pk
        })
        this.adminPublicKey.requireEquals(admin)
        return AccountUpdate.createSigned(admin)
    }

    @method.returns(Bool)
    public async canMint(_accountUpdate: AccountUpdate) {
        await this.ensureAdminSignature()
        return Bool(true)
    }

    @method.returns(Bool)
    public async canChangeAdmin(_admin: PublicKey) {
        await this.ensureAdminSignature()
        return Bool(true)
    }

    @method.returns(Bool)
    public async canPause(): Promise<Bool> {
        return Bool(false)
    }

    @method.returns(Bool)
    public async canResume(): Promise<Bool> {
        return Bool(false)
    }
}