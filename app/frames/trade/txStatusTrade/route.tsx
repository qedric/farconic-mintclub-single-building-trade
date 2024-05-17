/* eslint-disable react/jsx-key, @next/next/no-img-element, jsx-a11y/alt-text */
import { Button } from "frames.js/next"
import { frames } from "../../frames"
import { getTransactionReceipt } from '@/app/utils'
import buildings from '@/app/data/buildings.json'
import { decodeEventLog } from 'viem'
import { baseSepolia } from "viem/chains"
import abi from '@/app/data/mcv2bond_abi.json'
import { getMintClubContractAddress } from 'mint.club-v2-sdk'

const handleRequest = frames(async (ctx) => {

    if (ctx.message?.transactionId) {
        
        const url = `https://base-sepolia.blockscout.com/tx/${ctx.message.transactionId}`
        const receipt = await getTransactionReceipt(ctx.message.transactionId)
        const bond_contract_address = getMintClubContractAddress('BOND', baseSepolia.id)

        // Find the 'Mint' event log with the bond contract address
        const mintEvent = receipt.logs
        .filter(log => log.address.toLowerCase() === bond_contract_address.toLowerCase())
        .map(log => decodeEventLog({
            abi: abi,
            data: log.data,
            topics: log.topics
        }))
        .find(decodedLog => decodedLog.eventName === 'Mint')

        //console.log('mintEvent', mintEvent)

        if (!mintEvent) {
            return {
                image: (
                    <div>error can&apos;t find mint event</div>
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
                    <Button action="post" target={{ query: { transactionId: ctx.message.transactionId }, pathname: "/trade/sellApproved/txStatus" }}>
                        Refresh
                    </Button>
                ]
            }
        }

        if (receipt.status == 'success') {

            // get the building object from the buildings json based on the address
            const building_address = (mintEvent as any).args.token
            const building = buildings.find((building) => building.address === building_address)

            if (!building) {
                return {
                    image: (
                        <div>error can&apos;t find building</div>
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
                        <Button action="post" target={{ query: { transactionId: ctx.message.transactionId }, pathname: "/trade/sellApproved/txStatus" }}>
                            Refresh
                        </Button>
                    ]
                }
            }

            return {
                image: (
                    <div tw="flex">{`You bought ${building?.metadata.name}!`}</div>
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
                    <Button action="post" target={{ query: { transactionId: ctx.message.transactionId }, pathname: "/trade/sellApproved/txStatus" }}>
                        Refresh
                    </Button>
                ]
            }
        }
    } else {
        return {
            image: (
                <div>error can&apos;t find transaction</div>
            ),
            imageOptions: {
                aspectRatio: "1:1",
            },
            buttons: [
                <Button action="post" target="/">
                    Reset
                </Button>
            ]
        }
    }
})

export const GET = handleRequest
export const POST = handleRequest