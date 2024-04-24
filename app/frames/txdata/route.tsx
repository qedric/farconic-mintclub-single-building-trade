import { frames } from "../frames"
import { NextResponse } from "next/server"
import { MerkleTree } from "merkletreejs"
import { ethers } from "ethers"
import { encodeFunctionData } from "viem"
import { baseSepolia } from "viem/chains"
import abi from '../../data/abi.json'

const getMerkleProof = (allowlistedAddresses:string[], addressToProve:string, limitPerWallet:string, price:string) => {
    const leaves = allowlistedAddresses.map(x => ethers.keccak256(x))
    const merkle = new MerkleTree(leaves, ethers.keccak256, { hashLeaves: true, sortPairs: true })
    const proof = merkle.getHexProof(ethers.keccak256(addressToProve.toString()))

    return {
        proof: proof,
        quantityLimitPerWallet: limitPerWallet,
        pricePerToken: price,
        currency: ethers.ZeroAddress
    }
}

export const POST = frames(async (ctx) => {
    if (!ctx.message) {
        throw new Error("No message");
    }

    /*
        address _receiver,
        uint256[] calldata _tokenIds,
        uint256[] calldata _quantities,
        address _currency,
        uint256 _pricePerToken,
        AllowlistProof calldata _allowlistProof,
        bytes memory _data
    */
    // prepare our claim bundle function call
    const proof = getMerkleProof([], ctx.message.connectedAddress || "", "50", '0')
    const params = [
        ctx.message.connectedAddress,
        [10n, 20n, 30n, 40n, 50n],
        [1n, 1n, 1n, 1n, 1n],
        ethers.ZeroAddress,
        0n,
        proof,
        ''
    ]
    //const claimBatchABI = abi.filter(x => x.name === "claimBatch")[0];

    // prepare the transaction params for claimBatch function
    // prepare the transaction params for claimBatch function
    const calldata = encodeFunctionData({
        abi: abi,
        functionName: "claimBatch",
        args: params,
    })

    // Do something with the user's connected address that will be executing the tx
    /* const calldata_test = encodeFunctionData({
        abi: abi,
        functionName: "mintSingleNFT",
        args: [BigInt(99)],
    }); */

    return NextResponse.json({
        chainId: `eip155:${baseSepolia.id}`,
        method: "eth_sendTransaction",
        params: {
            abi: abi,
            to: `0x${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string}`,
            data: calldata
        }
    })
})