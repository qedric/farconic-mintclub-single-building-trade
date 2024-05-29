/* eslint-disable react/jsx-key, @next/next/no-img-element, jsx-a11y/alt-text */
import { Button } from "frames.js/next"
import { frames } from "../../frames"
import { getTransactionReceipt } from '@/app/utils'
import buildings from '@/app/data/buildings.json'
import { ErrorFrame } from "@/app/components/Error"
import { decodeEventLog } from 'viem'
import abi from '@/app/data/mc_building_abi.json'

const handleRequest = frames(async (ctx) => {

    const txId = ctx.message?.transactionId || ctx.searchParams.transactionId

    if (txId) {

        console.log('transactionId', txId)
       
        const url = `${process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL}/${txId}`
        let receipt
        try {
            receipt = await getTransactionReceipt(txId as `0x${string}`)
        } catch (e) {
            console.log('error getting receipt:', e)
            return ErrorFrame(
                "Error getting transaction receipt",
                'Refresh',
                JSON.stringify({ query: { transactionId: txId }, pathname: "/trade/txStatusApprove" })
            )
        }

        console.log('receipt', receipt)

        // Find the 'Mint' event log with the bond contract address
        // Find the 'ApprovalForAll' event log with the bond contract address
        const approveEventLog = receipt.logs
        .map(log => ({
            ...log,
            decoded: decodeEventLog({
                abi: abi,
                data: log.data,
                topics: log.topics
            })
        }))
        .find(log => log.decoded.eventName === 'ApprovalForAll')

        console.log('approveEventLog', approveEventLog)

        if (!approveEventLog) {
            return ErrorFrame(
                "Error: can't find approve event",
                'Refresh',
                JSON.stringify({ query: { transactionId: txId }, pathname: "/trade/txStatusApprove" })
            )
        }

        if (receipt.status == 'success') {

            // get the building object from the buildings json based on the address
            const building_address = (approveEventLog as any).address
            const building = buildings.find((building) => building.address?.toLowerCase() === building_address.toLowerCase())

            if (!building) {
                return ErrorFrame(
                    "Error: can't find building",
                    'Refresh',
                    JSON.stringify({ query: { transactionId: txId }, pathname: "/trade/txStatusApprove" })
                )
            }

            return {
                image: (
                    <div tw="flex items-center justify-center mx-auto">
                        <h1>Transaction Submitted</h1>
                    </div>
                ),
                imageOptions: {
                    aspectRatio: "1:1"
                },
                buttons: [
                    <Button action="post" target={{ query: { building: JSON.stringify(building), isSell: true }, pathname: "/trade" }}>
                        {`Sell ${building?.metadata.name}`}
                    </Button>,
                    <Button action="link" target={process.env.NEXT_PUBLIC_MORE_INFO_LINK as string}>
                        My Cards / Learn more
                    </Button>
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
                    <Button action="post" target={{ query: { transactionId: txId }, pathname: "/trade/txStatusApprove" }}>
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