import { http, createPublicClient, Abi, GetContractEventsReturnType } from "viem"
import { baseSepolia } from "viem/chains"
import { MerkleTree } from "merkletreejs"
import { ethers } from "ethers"
import { mintclub } from 'mint.club-v2-sdk'
import abi from './data/abi.json'
import mc_building_abi from './data/mc_building_abi.json'

const NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"

const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http()
})

export interface Metadata {
    name: string;
    description: string;
    image: string;
    external_url: string;
    background_color: string;
    attributes: Attribute[];
}

export interface Attribute {
    trait_type?: string;
    value: string;
}

export interface NFT {
    metadata: Metadata;
    id: string;
    tokenURI: string;
    address: string;
}

export const getTransactionReceipt = async (txId: `0x${string}`) => await publicClient.getTransactionReceipt({ hash: txId })

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
    //console.log(ipfs_link)
    const metadata = await fetch(ipfs_link.replace("ipfs://", `${process.env.NEXT_PUBLIC_GATEWAY_URL}`) as string)
    const json = await metadata.json()
    //console.log(json)
    return json.image.replace("ipfs://", `${process.env.NEXT_PUBLIC_GATEWAY_URL}`)
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

export const levenshteinDistance = (a: string, b: string): number => {
    const dp: number[][] = [];

    for (let i = 0; i <= a.length; i++) {
        dp[i] = [];
        for (let j = 0; j <= b.length; j++) {
            if (i === 0) {
                dp[i][j] = j;
            } else if (j === 0) {
                dp[i][j] = i;
            } else {
                dp[i][j] = Math.min(
                    dp[i - 1][j - 1] + (a[i - 1] !== b[j - 1] ? 1 : 0),
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1
                );
            }
        }
    }
    return dp[a.length][b.length];
}

export const getContractEvents = async (contractAddress: `0x${string}`): Promise<GetContractEventsReturnType> => {
    console.log('contract address:', contractAddress)
    const logs = await publicClient.getContractEvents({ 
        address: (contractAddress as `0x${string}`),
        abi: mc_building_abi,
        fromBlock: 9975081n,
        toBlock: 9975181n
      })
      console.log('logs', logs)
      return logs
}

export const getOpenseaData = async (address: string) => {

    const url = `https://testnets-api.opensea.io/api/v2/chain/base_sepolia/contract/${address}/nfts/${0}`

    try {
        const options = {
            method: 'GET',
            headers: { 'accept': 'application/json', 'x-api-key': process.env.OPENSEA_API_KEY }
        }

        let response: any
        await fetch(url, (options as any))
            .then(r => r.json())
            .then(json => response = json)
            .catch(err => console.error(err))

        return response.nft

    } catch (error) {
        console.error('Error fetching token supply:', error)
        return 'Error'
    }
}

export const getDetail = async (address: string) => await mintclub.network(baseSepolia.id).token(address).getDetail()