import { frames } from "../../frames"
import { NextResponse } from "next/server";
import { encodeFunctionData } from "viem";
import { baseSepolia } from "viem/chains"
import zap_abi from '@/app/data/zap_abi.json'
import building_abi from '@/app/data/mc_building_abi.json'
import { getMintClubContractAddress } from 'mint.club-v2-sdk'
import { estimatePrice, getNFTBalance } from '@/app/utils'

const SLIPPAGE_PERCENT = 1

export const POST = frames(async (ctx) => {

    let userAddress = ctx.message?.connectedAddress
    if (!userAddress) {
        throw new Error("No User Address")
    }

    if (!ctx.searchParams?.contractAddress) {
        throw new Error("No Token Address")
    }

    const zap_contract_address = getMintClubContractAddress('ZAP', baseSepolia.id)
    const building_address = ctx.searchParams.contractAddress;

    if (ctx.searchParams.isApproved === 'false') {
        // we need to approve the ZAP contract to spend the NFT
        console.log('approving contract to send NFT')

        const calldata = encodeFunctionData({
            abi: building_abi,
            functionName: 'setApprovalForAll',
            args: [zap_contract_address, true],
        })

        return NextResponse.json({
            chainId: `eip155:${baseSepolia.id}`,
            method: "eth_sendTransaction",
            params: {
                abi: building_abi,
                to: building_address,
                data: calldata,
                value: '0'
            }
        })
    }

    let qty = ctx.searchParams?.qty
        ? BigInt(ctx.searchParams.qty)
        : ctx.message?.inputText && /^\d+$/.test(ctx.message.inputText) && Number(ctx.message.inputText) > 0
            ? BigInt(ctx.message.inputText)
            : BigInt(1)

    const isSell:boolean = ctx.searchParams.isSell === 'true'
    //console.log('isSell:', isSell ? 'true' : 'false')

    if (!ctx.searchParams?.isApproved && isSell) {
        throw new Error("Missing isApproved param")
    }

    if (isSell) {
        // check that the connected address has balance to sell
        const balance:bigint = (await getNFTBalance((building_address as `0x${string}`), userAddress as `0x${string}` ) as bigint)
        console.log(`Balance: ${balance}`)
        if (balance < qty) {
            qty = balance
        }

        if (qty == BigInt(0)) {
            return NextResponse.json({ error: "No balance to sell; check that you're connected with the wallet that holds this NFT."}, { status: 500 })
        }
    }

    // if there's already a price estimation, use it, otherwise get a new one, and verify the qty
    let estimation:bigint = BigInt(0)
    if (ctx.searchParams.estimation) {
        estimation = BigInt(ctx.searchParams.estimation)
    } else {
        const newEstimation = await estimatePrice(building_address as `0x${string}`, qty, isSell)
        estimation = newEstimation.priceEstimate
        qty = newEstimation.qty
    }
    
    const slippageOutcome:bigint = isSell
        ? estimation - (estimation * BigInt(SLIPPAGE_PERCENT * 100)) / BigInt(10_000)
        : estimation + (estimation * BigInt(SLIPPAGE_PERCENT * 100)) / BigInt(10_000)

    const args = [building_address as `0x${string}`, qty, userAddress]
    console.log('args', args)

    if (isSell) {
        // insert slippageOutcome at index 2 of args:
        args.splice(2, 0, slippageOutcome)
    }

    const calldata = encodeFunctionData({
        abi: zap_abi,
        functionName: isSell ? "burnToEth" : "mintWithEth",
        args: args,
    })

    /* burnToEth:
    [
        {
            "internalType": "address",
            "name": "token",
            "type": "address"
        },
        {
            "internalType": "uint256",
            "name": "tokensToBurn",
            "type": "uint256"
        },
        {
            "internalType": "uint256",
            "name": "minRefund",
            "type": "uint256"
        },
        {
            "internalType": "address",
            "name": "receiver",
            "type": "address"
        }
    ] */

    //console.log('zap_contract_address', zap_contract_address)

    const params = isSell ? {
        abi: zap_abi,
        to: zap_contract_address,
        data: calldata,
        value: '0'
    } : {
        abi: zap_abi,
        to: zap_contract_address,
        data: calldata,
        value: slippageOutcome.toString()
    }

    //console.log('params', params)

    return NextResponse.json({
        chainId: `eip155:${baseSepolia.id}`,
        method: "eth_sendTransaction",
        params: params
    })
})