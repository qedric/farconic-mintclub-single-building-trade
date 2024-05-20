import { frames } from "../../frames"
import { NextResponse } from "next/server";
import { encodeFunctionData } from "viem";
import { baseSepolia } from "viem/chains"
import zap_abi from '@/app/data/zap_abi.json'
import building_abi from '@/app/data/mc_building_abi.json'
import { getMintClubContractAddress } from 'mint.club-v2-sdk'

const SLIPPAGE_PERCENT = 10

export const POST = frames(async (ctx) => {

    console.log('txdata POST handler called')


    if (!ctx.searchParams?.contractAddress) {
        throw new Error("No Token Address")
    }

    if (!ctx.searchParams?.userAddress) {
        throw new Error("No User Address")
    }

    const zap_contract_address = getMintClubContractAddress('ZAP', baseSepolia.id)
    const building_address = ctx.searchParams.contractAddress;

    if (ctx.searchParams?.approve) {
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

    if (!ctx.searchParams?.estimation) {
        throw new Error("No price estimation")
    }

    const userAddress = ctx.searchParams.userAddress
    const qty = ctx.searchParams?.qty ? BigInt(ctx.searchParams.qty) : 1
    const estimation:bigint = BigInt(ctx.searchParams.estimation)
    const isSell:boolean = ctx.searchParams.isSell == 'true'

    const slippageOutcome:bigint = isSell
        ? estimation - (estimation * BigInt(SLIPPAGE_PERCENT * 100)) / BigInt(10_000)
        : estimation + (estimation * BigInt(SLIPPAGE_PERCENT * 100)) / BigInt(10_000)

    const args = [building_address as `0x${string}`, qty, userAddress]

    console.log('isSell:', isSell ? 'true' : 'false')

    if (isSell) {
        // insert slippageOutcome at index 2 of args:
        args.splice(2, 0, '0')
    }

    const calldata = encodeFunctionData({
        abi: zap_abi,
        functionName: isSell ? "burnToEth" : "mintWithEth",
        args: args,
    })

    console.log('args', args)

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

    console.log('zap_contract_address', zap_contract_address)

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