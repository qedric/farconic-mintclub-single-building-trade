/* eslint-disable react/jsx-key, @next/next/no-img-element, jsx-a11y/alt-text */
import { Button } from "frames.js/next"
import { frames } from "../../frames"
import { getUserDataForFid } from 'frames.js'
import { getTransactionReceipt, NFT } from '@/app/utils'
import buildings from '@/app/data/buildings.json'
import { decodeEventLog } from 'viem'
import { baseSepolia } from "viem/chains"
import abi from '@/app/data/mcv2bond_abi.json'
import { getMintClubContractAddress } from 'mint.club-v2-sdk'
import { ErrorFrame } from "@/app/components/Error"
import { CardImage } from '@/app/components/Card'

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

        const userData = await getUserDataForFid({ fid: (ctx.message?.requesterFid as number) })
        
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

        console.log('mintOrBurnEvent', mintOrBurnEvent)

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
            const amount:bigint = isSell ? (mintOrBurnEvent as any).args.amountBurned : (mintOrBurnEvent as any).args.amountMinted
            const building = buildings.find((building) => building.address?.toLowerCase() === building_address.toLowerCase())

            if (!building) {
                return ErrorFrame(
                    "Error: can't find building",
                    'Refresh',
                    JSON.stringify({ query: { transactionId: txId }, pathname: "/trade/txStatusTrade" })
                )
            }

            const buildingName = building.metadata.name.toLowerCase().startsWith('the')
                ? amount > BigInt(1)
                    ? building.metadata.name.substring(0, 3).toUpperCase()
                    : building.metadata.name.toUpperCase()
                : isSell && amount == BigInt(1)
                    ? `the ${building.metadata.name.toUpperCase()}`
                    : building.metadata.name.toUpperCase()

            const singleBuyString = `You've acquired ${buildingName} Card`
            const multipleBuyString = `You've acquired ${amount} of ${buildingName} Cards`
            const singleSellString = `You sold ${buildingName} Card`
            const multipleSellString = `You sold ${amount} ${buildingName} Cards`

            const successString = !isSell && amount == BigInt(1)
                ? singleBuyString
                : !isSell && amount > BigInt(1)
                    ? multipleBuyString
                    : isSell && amount == BigInt(1)
                        ? singleSellString
                        : isSell && amount > BigInt(1)
                            ? multipleSellString
                            : singleBuyString
            

            return {
                image: (
                    <div tw="flex w-full h-full" style={{ backgroundImage: `url(https://ipfs.filebase.io/ipfs/QmRJx4BNegoXtzsZ64zqFwxqoXUFRZAmAQmG6ToLxU2SdV)`}}>
                        <div tw="flex flex-col relative bottom-20 w-full h-full items-center justify-center">
                            <h1 tw="relative top-[16%] text-7xl">SUCCESS!</h1>
                            { await CardImage(building as NFT, undefined, undefined, '0.6') }
                            { userData && 
                                <div tw="absolute top-[262px] w-full flex flex-col justify-center items-center">
                                    <img src={userData.profileImage} tw="w-[5.25vw] [5.25vw] rounded-full" />
                                    {/* <div tw="flex flex-col w-[5.25vw] h-[5.25vw] rounded-full">
                                        <div tw="flex justify-center items-center bg-green-200 w-full h-1/2 rounded-t-full text-center"><div>T</div></div>
                                        <div tw="flex justify-center items-center bg-red-200 w-full h-1/2 rounded-b-full text-center"><div>B</div></div>
                                    </div> */}
                                    <div tw="flex lowercase mt-1 text-[24px] text-white" style={{ transform: 'scale(0.6)' }}>@{ userData.username }</div>
                                </div>
                            }
                            <h1 tw="relative px-20 text-center bottom-[20%] flex text-4xl">{ successString }</h1>
                        </div>
                    </div> 
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