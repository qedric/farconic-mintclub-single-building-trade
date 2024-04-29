/* eslint-disable react/jsx-key */
import { Button } from "frames.js/next"
import { frames } from "../../frames"
import { baseSepolia } from "viem/chains"
import {
    createPublicClient,
    http,
    getContract,
    Abi
} from "viem"
import abi from '@/app/data/abi.json'
import nfts from '@/app/data/nfts.json'

const LAST_BUILDING_ID = 9

const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http()
})

const handleRequest = frames(async (ctx: any) => {

    if (ctx.message.requesterVerifiedAddresses.length == 0) {
        return {
            image: (
                <div tw="flex">
                    <h1>Sorry! We couldn't find a verified address</h1>
                </div>
            ),
            imageOptions: {
                aspectRatio: "1:1",
            },
            buttons: [
                <Button action="post" target="/">
                    reset
                </Button>,
                <Button action="link" target={process.env.NEXT_PUBLIC_OPENSEA_LINK as string}>
                    view on opensea
                </Button>
            ]
        }
    }

    const userAddress = ctx.message.requesterVerifiedAddresses[0]

    // 1. check the user's building token balance
    const contract = getContract({
        address: `0x${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string}`,
        abi: (abi.filter((item: any) => item.name === "balanceOfBatch") as Abi),
        client: publicClient
    })

    // check if a user has a full set of building tokens to claim a city token
    const accounts: string[] = Array(LAST_BUILDING_ID + 1).fill(userAddress)
    const ids: number[] = Array.from({ length: LAST_BUILDING_ID + 1 }, (_, i) => i)
    const buildingCount: number[] = (await contract.read.balanceOfBatch([accounts, ids]) as number[])

    // keep track of our buildings with a map
    const cityBuildings = new Map<number, number[]>();
    // if we find a valid city claim, this will hold the city tokenId:
    let cityClaimArgs: any = undefined

    console.log('buildingCount:', buildingCount)

    // loop through all building tokens to match each building token with its city
    for (let buildingId = 0; buildingId < buildingCount.length; buildingId++) {
        const building = buildingCount[buildingId]
        if (building > 0) { // at least one of this building is owned

            // query our nfts to get the city tokenId for this building
            const buildingNFT = nfts.find((nft) => parseInt(nft.id) == buildingId)
            const cityName = buildingNFT?.metadata.attributes.find((attr) => attr.trait_type == 'City')?.value
            const city = nfts.find((nft) => nft.metadata.name == cityName)
            const cityId = parseInt(city?.id || '-1')
            const cityBuildingCount = city?.metadata.attributes.find((attr) => attr.trait_type == 'Number of Buildings')?.value

            // add the building tokenId to the city mapping's buildings array
            const buildingsForThisCity: number[] = cityBuildings.get(cityId) || []
            buildingsForThisCity.push(buildingId)

            // if we have all the buildings, we break to burn buildings and claim our city
            if (cityBuildingCount == buildingsForThisCity.length) {
                console.log('can claim city!', cityId)
                cityClaimArgs = {city, buildingsForThisCity}
                break; // This will exit the entire loop
            } else {
                // keep track for next iteration
                cityBuildings.set(cityId, buildingsForThisCity)
            }
        }
    }

    console.log('buildingsOfCity:', cityBuildings)

    return cityClaimArgs ? { 
        image: (
            <div tw="flex">
                <p>You can claim</p>
                <h1>{cityClaimArgs?.city.cityName}</h1>
            </div>
        ),
        imageOptions: {
            aspectRatio: "1:1",
        },
        buttons: [
            <Button action="post" target="/city/claim">
                {`claim ${cityClaimArgs?.city.cityName}`}
            </Button>,
            <Button action="link" target={process.env.NEXT_PUBLIC_OPENSEA_LINK as string}>
                view on opensea
            </Button>
        ],
        state: cityClaimArgs
    } : {
        image: (
            <div tw="flex">
                <h1>Sorry! You don't have a full set</h1>
            </div>
        ),
        imageOptions: {
            aspectRatio: "1:1",
        },
        buttons: [
            <Button action="post" target="/">
                reset
            </Button>,
            <Button action="link" target={process.env.NEXT_PUBLIC_OPENSEA_LINK as string}>
                view on opensea
            </Button>
        ]
    }
})

export const GET = handleRequest
export const POST = handleRequest