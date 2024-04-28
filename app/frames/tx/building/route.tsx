import { frames } from "../../frames"
import { TransactionTargetResponse } from "frames.js";
import { NextResponse } from "next/server"
import { MerkleTree } from "merkletreejs"
import { ethers } from "ethers"
import { encodeFunctionData, Abi } from "viem"
import { baseSepolia } from "viem/chains"
import abi from '../../../data/abi.json'

const ZERO_BYTES = ethers.zeroPadValue(ethers.toUtf8Bytes(''), 32)
const NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"

const getMerkleProof = (allowlistedAddresses: string[], addressToProve: string, limitPerWallet: string, price: string) => {
    const leaves = allowlistedAddresses.map(x => ethers.keccak256(x))
    const merkle = new MerkleTree(leaves, ethers.keccak256, { hashLeaves: true, sortPairs: true })
    const proof = merkle.getHexProof(ethers.keccak256(addressToProve.toString()))

    return {
        proof: proof,
        quantityLimitPerWallet: limitPerWallet,
        pricePerToken: price,
        currency: NATIVE_TOKEN
    }
}

export const POST = frames(async (ctx) => {
    if (!ctx.message) {
      throw new Error("No message");
    }
   
    const userAddress = ctx.message.connectedAddress;

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
    const proof = getMerkleProof([], userAddress || "", "50", '0')
    const params = [
        userAddress,
        [2n, 3n, 4n, 5n],
        [1n, 1n, 1n, 1n],
        NATIVE_TOKEN,
        0n,
        proof,
        ZERO_BYTES
    ]
    //const claimBatchABI = abi.filter(x => x.name === "claimBatch")[0];

    // prepare the transaction params for claimBatch function
    const calldata = encodeFunctionData({
        abi: abi,
        functionName: "claimBatch",
        args: params,
    })

    return NextResponse.json<TransactionTargetResponse>({
        chainId: `eip155:${baseSepolia.id}`,
        method: "eth_sendTransaction",
        params: {
            abi: abi as Abi,
            to: `0x${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string}`,
            data: calldata,
            value: "0"
        }
    })
})