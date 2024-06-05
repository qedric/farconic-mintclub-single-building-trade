/* eslint-disable react/jsx-key, @next/next/no-img-element, jsx-a11y/alt-text */
import { Button } from "frames.js/next"
import { frames } from "../../frames"
import { getUserDataForFid } from 'frames.js'
import { getTransactionReceipt, NFT } from '@/app/utils'
import { decodeEventLog } from 'viem'
import { baseSepolia } from "viem/chains"
import { getMintClubContractAddress } from 'mint.club-v2-sdk'
import { ErrorFrame } from "@/app/components/Error"
import { CardImage } from '@/app/components/Card'
import abi from '@/app/data/mcv2bond_abi.json'
import buildings from '@/app/data/buildings.json'

const handleRequest = frames(async (ctx) => {

    const txId = ctx.message?.transactionId || ctx.searchParams.transactionId

    if (txId) {

        //console.log('transactionId', txId)
       
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

        //console.log('mintOrBurnEvent', mintOrBurnEvent)

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

            const addThe = (bulidingName:string) => bulidingName.toLowerCase().startsWith('the') ? bulidingName : `the ${bulidingName}`
            const removeThe = (bulidingName:string) => bulidingName.toLowerCase().startsWith('the') ? bulidingName.substring(0, 3) : bulidingName
            const successString = `${isSell ? "You've parted with" : "You've acquired"} ${ amount > BigInt(1) ? `${amount} ${removeThe(building.metadata.name)} cards` : `${addThe(building.metadata.name)} card`}`

            return {
                image: (
                    <div tw="flex w-full h-full" style={{ backgroundImage: `url(https://ipfs.filebase.io/ipfs/QmRJx4BNegoXtzsZ64zqFwxqoXUFRZAmAQmG6ToLxU2SdV)`}}>
                        <div tw="flex flex-col relative bottom-[40px] w-full h-full items-center justify-center">
                            <h1 tw="relative top-[18%] text-[60px]">{ isSell ? 'SOLD!' : 'CONGRATULATIONS!' }</h1>
                            { await CardImage(building as NFT, undefined, undefined, '0.50') }
                            { userData && 
                                <div tw="absolute top-[310px] w-full flex flex-col justify-center items-center">
                                    <img src={userData.profileImage} tw="w-[4.55vw] [4.55vw] rounded-full" />
                                    {/* <div tw="flex flex-col w-[5.25vw] h-[5.25vw] rounded-full">
                                        <div tw="flex justify-center items-center bg-green-200 w-full h-1/2 rounded-t-full text-center"><div>T</div></div>
                                        <div tw="flex justify-center items-center bg-red-200 w-full h-1/2 rounded-b-full text-center"><div>B</div></div>
                                    </div> */}
                                    <div tw="flex lowercase text-[14px] text-white" style={{ transform: 'scale(0.6)' }}>@{ userData.username }</div>
                                </div>
                            }
                            <h1 tw="relative px-20 text-center bottom-[280px] flex text-[32px]">{ successString }</h1>
                        </div>
                    </div> 
                ),
                imageOptions: {
                    aspectRatio: "1:1",
                },
                buttons: [
                    <Button action="link" target={`https://warpcast.com/~/compose?text=I just ${isSell ? 'sold' : 'bought'} ${addThe(building.metadata.name)}!%0Ahttps://farconic-mintclub-building-trade.vercel.app/`}>
                        {`🔄 Share`}
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