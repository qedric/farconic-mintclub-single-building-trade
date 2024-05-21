/* eslint-disable react/jsx-key, @next/next/no-img-element, jsx-a11y/alt-text */
import { Button } from "frames.js/next"
import { frames } from "../../frames"
import { getTransactionReceipt } from '@/app/utils'
import buildings from '@/app/data/buildings.json'
import { decodeEventLog } from 'viem'
import { baseSepolia } from "viem/chains"
import abi from '@/app/data/mcv2bond_abi.json'
import { getMintClubContractAddress } from 'mint.club-v2-sdk'
import { ErrorFrame } from "@/app/components/Error"

const handleRequest = frames(async (ctx) => {

    const txId = ctx.message?.transactionId || ctx.searchParams.transactionId

    if (txId) {

        console.log('transactionId', txId)
       
        const url = `${process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL}/${txId}`
        const bond_contract_address = getMintClubContractAddress('BOND', baseSepolia.id)
        let receipt
        try {
            receipt = await getTransactionReceipt(txId as `0x${string}`)
        } catch (e) {
            console.log(e)
            return ErrorFrame(
                "Error getting transaction receipt",
                'Refresh',
                JSON.stringify({ query: { transactionId: txId }, pathname: "/trade/txStatusTrade" })
            )
        }
        
        // Find the 'Mint' or 'Burn' event log with the bond contract address
        const mintOrBurnEvent = receipt.logs
        .filter(log => log.address.toLowerCase() === bond_contract_address.toLowerCase())
        .map(log => decodeEventLog({
            abi: abi,
            data: log.data,
            topics: log.topics
        }))
        .find(decodedLog => decodedLog.eventName === 'Mint' || decodedLog.eventName === 'Burn')

        const isSell = mintOrBurnEvent?.eventName === 'Burn'

        if (!mintOrBurnEvent) {
            return ErrorFrame(
                "Error: can't find the transaction details",
                'Refresh',
                JSON.stringify({ query: { transactionId: txId }, pathname: "/trade/txStatusTrade" })
            )
        }

        if (receipt.status == 'success') {

            // get the building object from the buildings json based on the address
            const building_address = (mintOrBurnEvent as any).args.token
            const building = buildings.find((building) => building.address?.toLowerCase() === building_address.toLowerCase())

            if (!building) {
                return ErrorFrame(
                    "Error: can't find building",
                    'Refresh',
                    JSON.stringify({ query: { transactionId: txId }, pathname: "/trade/txStatusTrade" })
                )
            }

            return {
                image: (
                    <div tw="flex flex-col justify-center items-center w-full h-full">
                        <div tw="flex shadow-xl">
                            <img width="500" src={building.metadata.image.replace("ipfs://", `${process.env.NEXT_PUBLIC_GATEWAY_URL}`) as string} />
                        </div>
                        <div tw="flex flex-col items-center">
                            <div tw="flex">{ isSell ? `You sold` : `You bought` }{ ` ${building?.metadata.name}!` }</div>
                        </div>
                    </div>
                    
                ),
                buttons: [
                    <Button action="post" target="/">
                        Reset
                    </Button>,
                    <Button action="link" target={url}>
                        View tx
                    </Button>,
                ]
            }
        } else {
            return {
                image: (
                    <div>{`transaction status: ${receipt.status}`}</div>
                ),
                imageOptions: {
                    aspectRatio: "1:1",
                },
                buttons: [
                    <Button action="post" target="/">
                        Reset
                    </Button>,
                    <Button action="link" target={url}>
                        View tx
                    </Button>,
                    <Button action="post" target={{ query: { transactionId: txId }, pathname: "/trade/txStatusTrade" }}>
                        Refresh
                    </Button>
                ]
            }
        }
    } else {
        return ErrorFrame("Error: can't find transaction")
    }
})

export const GET = handleRequest
export const POST = handleRequest