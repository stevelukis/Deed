import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

const ethToWei = (n: number | string) => {
    return ethers.utils.parseUnits(n.toString(), 'ether');
};

describe("Deed", () => {
    const deployDeedFixture = async () => {
        const [_, lawyer, beneficiary] = await ethers.getSigners();

        const amount = ethToWei("10");
        const fromNow = 10000;

        const Deed = await ethers.getContractFactory("Deed");
        const deed = await Deed.deploy(
            lawyer.address,
            beneficiary.address,
            fromNow,
            { value: amount });

        const blockNumber = await ethers.provider.getBlockNumber();
        const blockTimestamp = (await ethers.provider.getBlock(blockNumber)).timestamp;
        const earliest = blockTimestamp + fromNow;

        return { deed, lawyer, beneficiary, earliest, amount };
    };

    describe("Deploy", () => {
        it("Should return the correct lawyer address", async () => {
            const { deed, lawyer } = await loadFixture(deployDeedFixture);
            expect(await deed.lawyer()).to.equal(lawyer.address);
        });

        it("Should return the correct beneficiary address", async () => {
            const { deed, beneficiary } = await loadFixture(deployDeedFixture);
            expect(await deed.beneficiary()).to.equal(beneficiary.address);
        });

        it("Should return the correct earliest timestamp", async () => {
            const { deed, earliest } = await loadFixture(deployDeedFixture);
            expect(await deed.earliest()).to.equal(earliest);
        });
    });

    describe("Withdraw", () => {
        describe("Success", () => {
            it("Should transfer the amount to beneficiary", async () => {
                const { deed, lawyer, beneficiary, earliest, amount } = await loadFixture(deployDeedFixture);

                // Manipulate the time, skipping forward
                await time.increaseTo(earliest);

                const initialBalance = await beneficiary.getBalance();
                await deed.connect(lawyer).withdraw();
                const finalBalance = await beneficiary.getBalance();

                expect(finalBalance).to.equal(initialBalance.add(amount));
            });
        });

        describe("Failure", () => {
            it("Should be reverted if not called by lawyer", async () => {
                const { deed, beneficiary } = await loadFixture(deployDeedFixture);
                await expect(deed.connect(beneficiary).withdraw())
                    .to.be.revertedWith("Only the lawyer can invoke the withdrawal");
            });

            it("Should be reverted if called before earliest", async () => {
                const { deed, lawyer } = await loadFixture(deployDeedFixture);
                await expect(deed.connect(lawyer).withdraw())
                    .to.be.revertedWith("It is too early to withdraw");
            });
        });
    });
});