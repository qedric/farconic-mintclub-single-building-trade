import { mintclub } from 'mint.club-v2-sdk'
import mc_building_abi from './data/mc_building_abi.json'
import buildings from '@/app/data/buildings.json'
import { ethers } from 'ethers'
import { FramesMiddleware } from "frames.js/types"

const favBuildingNames: string[] = [
    "Eiffel Tower",
    "Burj Khalifa",
    "Statue of Liberty",
    "Big Ben",
    "Arc de Triomphe",
    "Chrysler Building",
    "Hagia Sophia",
    "Empire State Building",
    "Christ the Redeemer",
    "Tower Bridge",
    "Golden Gate Bridge",
    "Funkturm Berlin"
]

const publicClient = mintclub.network('basesepolia').getPublicClient()

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
    building_color: string;
    address: string;
}

export const getTransactionReceipt = async (txId: `0x${string}`) => await publicClient.waitForTransactionReceipt({ hash: txId,  pollingInterval: 500, retryCount: 8})

export const fetchImageUrlFromIPFS = async (ipfs_link: string) => {
    // get the image value from the metadata resolved by the ipfs link
    //console.log(ipfs_link)
    const metadata = await fetch(ipfs_link.replace("ipfs://", `${process.env.NEXT_PUBLIC_GATEWAY_URL}`) as string)
    const json = await metadata.json()
    //console.log(json)
    return json.image.replace("ipfs://", `${process.env.NEXT_PUBLIC_GATEWAY_URL}`)
}

export const fetchImageUrlFromTokenId = async (id: number, abi:any) => {
    const ipfs_link: string = await publicClient.readContract({
        address: `0x${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string}`,
        abi: (abi.filter((item: any) => item.name === "uri") as any),
        functionName: 'uri',
        args: [id]
    }) as string
    return fetchImageUrlFromIPFS(ipfs_link)
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

export const getDetail = async (address: string) => await mintclub.network('basesepolia').token(address).getDetail()

export const searchJsonArray = (query: string): NFT[] => {
    const lowerCaseQuery = query.toLowerCase()
    const matchingElements: NFT[] = []

    // skip search & return a random element from the buildings array
    if (query == 'random') {
        return (new Array(buildings[Math.floor(Math.random() * buildings.length)]) as NFT[])
    }

    for (const element of buildings as NFT[]) {
        const metadataValues = Object.values(element.metadata)
            .filter(value => typeof value === 'string')
            .map(value => (value as string).toLowerCase())
        
        let found = false // Flag to indicate if the element has been found
        for (const value of metadataValues) {
            if (value.includes(lowerCaseQuery) || levenshteinDistance(value, lowerCaseQuery) <= 2) {
                if (!found) {
                    matchingElements.push(element)
                    found = true // Set found flag to true
                }
                break // Stop checking metadata values for this element once a match is found
            }
        }

        for (const attribute of element.metadata.attributes) {
            if (typeof attribute.value === 'string' &&
                (attribute.value.toLowerCase().includes(lowerCaseQuery) ||
                levenshteinDistance(attribute.value.toLowerCase(), lowerCaseQuery) <= 2)) {
                if (!found) {
                    matchingElements.push(element)
                    found = true // Set found flag to true
                }
                break // Stop checking attributes for this element once a match is found
            }
        }
    }

    return matchingElements
}

export const getNFTBalance = async (tokenAddress: `0x${string}`, userAddress: `0x${string}`) => await publicClient.readContract({
    address: tokenAddress,
    abi: mc_building_abi,
    functionName: 'balanceOf',
    args: [userAddress, 0]
})

export const getRandomBuildingAmongFavourites = (excludeName?: string): NFT => {
    // Remove the excluded name from the favorite building names array
    const filteredBuildingNames = excludeName ? favBuildingNames.filter(name => name !== excludeName) : favBuildingNames;

    // get a random name from the filteredBuildingNames array and find the matching building
    const buildingName = filteredBuildingNames[Math.floor(Math.random() * filteredBuildingNames.length)];
    return buildings.find((b) => b.metadata.name === buildingName) as NFT
}

export const getFavouriteBuildings = () => buildings.filter((b) => favBuildingNames.includes(b.metadata.name)) as NFT[]

export const getBuildingByName = (name: string) => buildings.find((b) => b.metadata.name.toLowerCase() === name.toLowerCase()) as NFT

export const estimatePrice = async (buildingAddress: `0x${string}`, qty: bigint, isSell: boolean) => {

    const details = await mintclub.network('basesepolia').token(buildingAddress).getDetail()
    if (qty > details.info.maxSupply - details.info.currentSupply) {
        qty = details.info.maxSupply - details.info.currentSupply
    } 

    if (isSell && qty > details.info.currentSupply) {
        qty = details.info.currentSupply
    }

    const [priceEstimate, royalty] = isSell
    ? await mintclub
        .network('basesepolia')
        .token(buildingAddress)
        .getSellEstimation(qty)
    : await mintclub
        .network('basesepolia')
        .token(buildingAddress)
        .getBuyEstimation(qty)
    console.log(`Estimate for ${qty} of ${buildingAddress}: ${ethers.formatUnits(priceEstimate, 18)} ETH`)
    console.log('Royalties paid:', ethers.formatUnits(royalty.toString(), 18).toString())

    return { priceEstimate, qty }
}

export const estimatePriceMiddleware: FramesMiddleware<any, {priceEstimate: bigint, qty: bigint, isSell: boolean, details: object}> = async (
    ctx:any,
    next
) => {
    if (!ctx.message) {
        throw new Error("No message")
    }

    if (!ctx.searchParams.building) {
        throw new Error("No building in searchParams")
    }

    const building:NFT = JSON.parse(ctx.searchParams.building)
    const details = await mintclub.network('basesepolia').token(building.address).getDetail()

    let qty: bigint = BigInt(1)
    if (ctx.message.inputText) {
        try {
            const inputQty = BigInt(ctx.message.inputText)
            if (inputQty <= details.info.maxSupply - details.info.currentSupply) {
                qty = inputQty
            } else {
                qty = details.info.maxSupply - details.info.currentSupply
            }
        } catch (error) {
            // qty stays as 1, carry on
        }
    } else if (ctx.searchParams.qty) {
        try {
            const inputQty = BigInt(ctx.searchParams.qty)
            if (inputQty <= details.info.maxSupply - details.info.currentSupply) {
                qty = inputQty
            } else {
                qty = details.info.maxSupply - details.info.currentSupply
            }
        } catch (error) {
            // qty stays as 1, carry on
        }
    }

    const isSell:boolean = ctx.searchParams.isSell === 'true'
    if (isSell && qty > details.info.currentSupply) {
        qty = details.info.currentSupply
    }

    //console.log('estimating price for', qty, building.metadata.name, building.address)

    const [estimation, royalty] = isSell
    ? await mintclub
        .network('basesepolia')
        .token(building.address)
        .getSellEstimation(qty)
    : await mintclub
        .network('basesepolia')
        .token(building.address)
        .getBuyEstimation(qty)
    console.log(`Estimate for ${qty} ${building.metadata.name}: ${ethers.formatUnits(estimation, 18)} ETH`)
    console.log('Royalties paid:', ethers.formatUnits(royalty.toString(), 18).toString())

    return next({ priceEstimate: estimation, qty, isSell, details })

}