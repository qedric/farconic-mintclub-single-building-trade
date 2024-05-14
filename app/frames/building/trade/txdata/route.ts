import { frames } from "../../../frames"
import { NextResponse } from "next/server";
import { encodeFunctionData } from "viem";
import { baseSepolia } from "viem/chains"
import abi from '@/app/data/zap_abi.json'
import { getMintClubContractAddress } from 'mint.club-v2-sdk'

const SLIPPAGE_PERCENT = 10

export const POST = frames(async (ctx) => {
    if (!ctx.searchParams?.contractAddress) {
        throw new Error("No message")
    }

    if (!ctx.searchParams?.qty) {
        throw new Error("No quantity")
    }

    if (!ctx.searchParams?.estimation) {
        throw new Error("No price estimation")
    }

    const userAddress = (ctx as any).message.requesterVerifiedAddresses[0]
    const building_address = ctx.searchParams.contractAddress;
    const qty = BigInt(ctx.searchParams.qty)
    const estimation:bigint = BigInt(ctx.searchParams.estimation)

    console.log('building_address', building_address)

    const slippageOutcome =
        estimation + (estimation * BigInt(SLIPPAGE_PERCENT * 100)) / BigInt(10_000)

    const args = [building_address as `0x${string}`, qty, userAddress]
    if (ctx.searchParams.isSell) {
        // insert slippageOutcome at index 2 of args:
        args.splice(2, 0, slippageOutcome)
    }
    const zap_contract_address = getMintClubContractAddress('ZAP', baseSepolia.id)

    const calldata = encodeFunctionData({
        abi: abi,
        functionName: ctx.searchParams.isSell ? "burnToEth" : "mintWithEth",
        args: args,
    })

    return NextResponse.json({
        chainId: `eip155:${baseSepolia.id}`,
        method: "eth_sendTransaction",
        params: ctx.searchParams.isSell ? {
            abi: abi,
            to: zap_contract_address,
            data: calldata
        } : {
            abi: abi,
            to: zap_contract_address,
            data: calldata,
            value: slippageOutcome.toString()
        }
    })
})