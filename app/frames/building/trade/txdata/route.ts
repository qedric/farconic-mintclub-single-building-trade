import { frames } from "../../../frames"
import { NextResponse } from "next/server";
import {
    createPublicClient,
    encodeFunctionData,
    http,
} from "viem";
import { baseSepolia } from "viem/chains"
import abi from '@/app/data/zap_abi.json'
import { ethers } from "ethers"
import {
    getMintClubContractAddress,
    mintclub
  } from 'mint.club-v2-sdk'

const SLIPPAGE_PERCENT = 10

export const POST = frames(async (ctx) => {
    if (!ctx.searchParams?.contractAddress) {
        throw new Error("No message")
    }

    if (!ctx.searchParams?.qty) {
        throw new Error("No quantity")
    }

    const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(),
    })

    const userAddress = (ctx as any).message.requesterVerifiedAddresses[0]
    const building_address = ctx.searchParams.contractAddress;
    const qty = BigInt(ctx.searchParams.qty)

    console.log('building_address', building_address)

    const estimate = async (amount:bigint) => {
        const [estimation, royalty] = await mintclub
          .network('basesepolia')
          .token(building_address)
          .getBuyEstimation(amount)
        console.log(`Estimated cost for ${amount}: ${ethers.formatUnits(estimation, 18)} ETH`)
        console.log('Royalties paid:', ethers.formatUnits(royalty.toString(), 18).toString())
        return estimation
    }

    const estimated = await estimate(qty)
    const slippageOutcome =
        estimated + (estimated * BigInt(SLIPPAGE_PERCENT * 100)) / BigInt(10_000)

    const args = [building_address as `0x${string}`, qty.toString(), userAddress]
    const zap_contract_address = getMintClubContractAddress('ZAP', baseSepolia.id)

    /* try {
        await publicClient.simulateContract({
            account: userAddress,
            address: zap_contract_address,
            abi: abi,
            functionName: 'mintWithEth',
            args: args,
            value: slippageOutcome
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({
            error
        })
    } */

    // Do something with the user's connected address that will be executing the tx
    const calldata = encodeFunctionData({
        abi: abi,
        functionName: "mintWithEth",
        args: args,
    })

    return NextResponse.json({
        chainId: `eip155:${baseSepolia.id}`,
        method: "eth_sendTransaction",
        params: {
            abi: abi,
            to: zap_contract_address,
            data: calldata,
            value: slippageOutcome.toString()
        }
    })
})