import { http, createPublicClient, Abi } from "viem"
import { baseSepolia } from "viem/chains"
import { MerkleTree } from "merkletreejs"
import { ethers } from "ethers"
import abi from './data/abi.json'

const NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"

const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http()
})

export const getMerkleProof = (allowlistedAddresses: string[], addressToProve: string, limitPerWallet: string, price: string) => {
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

export const fetchImageUrlFromIPFS = async (ipfs_link: string) => {
    // get the image value from the metadata resolved by the ipfs link
    console.log(ipfs_link)
    const metadata = await fetch(ipfs_link.replace("ipfs://", "https://ipfs.io/ipfs/") as string)
    const json = await metadata.json()
    console.log(json)
    return json.image.replace("ipfs://", "https://ipfs.io/ipfs/")
}

export const fetchImageUrlFromTokenId = async (id: number) => {
    const ipfs_link: string = await publicClient.readContract({
        address: `0x${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string}`,
        abi: (abi.filter((item: any) => item.name === "uri") as Abi),
        functionName: 'uri',
        args: [id]
    }) as string
    return fetchImageUrlFromIPFS(ipfs_link)
}

export const uint8ArrayToHex = (
    value: Uint8Array
) => {
    const hexes = /* @__PURE__ */ (() =>
        Array.from({ length: 256 }, (_v, i) => i.toString(16).padStart(2, "0")))()
    let string = ""
    for (let i = 0; i < value.length; i++) {
        // biome-ignore lint/style/noNonNullAssertion: we know this is defined
        string += hexes[value[i]]
    }
    return `0x${string}`
}

export const randomBytes32 = async () => {
    return uint8ArrayToHex(
        globalThis.crypto.getRandomValues(new Uint8Array(32)),
    )
}

export const getTypedData = async function (
    to: string,
    inTokenIds: number[],
    outTokenId: number
) {

    const uuidBytes = await randomBytes32()
    const validStartTime = await publicClient.getBlock().then(block => block.timestamp)
    const validEndTime = BigInt(Math.floor(Number(validStartTime) + 60 * 60 * 24))

    return {
        types: {
            ClaimRequest: [
                { name: "to", type: "address" },
                { name: "inTokenIds", type: "uint256[]" },
                { name: "outTokenId", type: "uint256" },
                { name: "validityStartTimestamp", type: "uint128" },
                { name: "validityEndTimestamp", type: "uint128" },
                { name: "uid", type: "bytes32" }
            ],
        },
        domain: {
            name: 'CitiesSignatureClaim',
            version: "1",
            chainId: baseSepolia.id,
            verifyingContract: `0x${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string}`,
        },
        primaryType: 'ClaimRequest',
        message: {
            to: to,
            inTokenIds: inTokenIds,
            outTokenId: outTokenId,
            validityStartTimestamp: validStartTime.toString(),
            validityEndTimestamp: validEndTime.toString(),
            uid: uuidBytes
        },
    }
}