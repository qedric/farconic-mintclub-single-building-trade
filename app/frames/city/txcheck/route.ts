/* eslint-disable react/jsx-key */
import { NextRequest, NextResponse } from "next/server";
import { getFrameMessage } from "frames.js/next/server";
import { TransactionTargetResponse } from "frames.js";
import { baseSepolia } from "viem/chains"
import {
    createPublicClient,
    http,
    getContract,
    Abi
} from "viem"
import abi from '@/app/data/abi.json'
import registry from '@/app/data/registry.json'

const LAST_BUILDING_ID = 9

const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http()
})

export async function POST(
    req: NextRequest
  ): Promise<NextResponse<TransactionTargetResponse>> {
    const json = await req.json();
  
    const frameMessage = await getFrameMessage(json);
  
    if (!frameMessage) {
      throw new Error("No frame message");
    }

    // 1. check the user's building token balance
    const contract = getContract({
        address: `0x${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string}`,
        abi: (abi.filter((item: any) => item.name === "balanceOfBatch") as Abi),
        client: publicClient
    })

    // check if a user has a full set of building tokens to claim a city token
    const accounts: string[] = Array(LAST_BUILDING_ID + 1).fill(frameMessage.connectedAddress)
    const ids: number[] = Array.from({ length: LAST_BUILDING_ID + 1 }, (_, i) => i)
    const buildingCount: number[] = (await contract.read.balanceOfBatch([accounts, ids]) as number[])

    // keep track of our buildings with a map
    const cityBuildings = new Map<number, number[]>();
    // if we find a valid city claim, this will hold the city tokenId:
    let cityClaimArgs: any = undefined

    console.log('buildingCount:', buildingCount)

    // loop through buildingCount to match each building token with its city
    for (let i = 0; i < buildingCount.length; i++) {
        const building = buildingCount[i];
        if (building > 0) { // at least one of this building is owned

            // query our registry to get the city tokenId for this building
            const cityId: number = (registry.buildings.find((building) => (building.buildingId as number) === i)?.cityId as number)
            const city = registry.cities.find((city) => city.cityId === cityId)

            // add the building tokenId to the city mapping's buildings array
            const buildingsForThisCity: number[] = cityBuildings.get(cityId) || []
            buildingsForThisCity.push(building)

            // if we have all the buildings, we break to burn buildings and claim our city
            if (city?.buildingCount == buildingsForThisCity.length) {
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

    return NextResponse.json({
        chainId: "eip155:10", // OP Mainnet 10
        method: "eth_sendTransaction",
        params: {
          abi: (abi.filter((item: any) => item.name === "claimWithSignature") as Abi),
          to: STORAGE_REGISTRY_ADDRESS,
          data: calldata,
          value: unitPrice.toString(),
        },
      });
}