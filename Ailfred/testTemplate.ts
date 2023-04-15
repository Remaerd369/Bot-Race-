export const nameRegex = /(\w+$)/;

export const emptyTest = function (
  contractPath: string,
  functionName: string | RegExpMatchArray
): string {
  let match: RegExpMatchArray | null,
    name: string | RegExpMatchArray;

  match = contractPath.match(nameRegex);
  // Change type to insert into string
  name = match == null ? "" : match[1];

  return `
/* =====================================================
                        TEST TEMPLATE
===================================================== */
 // Add expected imports
import '@nomiclabs/hardhat-waffle';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
describe.skip(\`${name} / ${functionName}\`, function () {
    // Add expected definitions
    let user: SignerWithAddress;
    // Add expected setups depending on the function tested
    before(async function () {
        ({ user } = 
            await setup());
    });
    // Substitute text in capitals with actual function behaviour tested
    describe('FUNCTION_BEHAVIOUR', function () {
        it('FAILS', async function () {
            const tx = contract.connect(user).method();
            await expect(tx).to.be.reverted;
        });
        it('SUCCEEDS', async function () {
            const tx = contract.connect(user).method();
            await expect(tx).to.emit(event, "");
        });
    });
});
`;
};
