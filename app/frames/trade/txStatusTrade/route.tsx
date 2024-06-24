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
                "Transaction Receipt Not Found",
                'Refresh',
                JSON.stringify({ query: { transactionId: txId }, pathname: "/trade/txStatusTrade" }),
                "Refresh and see if that helps. If not, let us know!"
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
                "Transaction Details Not Found",
                'Refresh',
                JSON.stringify({ query: { transactionId: txId }, pathname: "/trade/txStatusTrade" }),
                "Refresh and see if that helps. If not, let us know!"
            )
        }

        if (receipt.status == 'success') {

            // get the building object from the buildings json based on the address
            const building_address = (mintOrBurnEvent as any).args.token
            const amount:bigint = isSell ? (mintOrBurnEvent as any).args.amountBurned : (mintOrBurnEvent as any).args.amountMinted
            const building = buildings.find((building) => building.address?.toLowerCase() === building_address.toLowerCase())

            if (!building) {
                return ErrorFrame(
                    "Building Not Found",
                    'Refresh',
                    JSON.stringify({ query: { transactionId: txId }, pathname: "/trade/txStatusTrade" }),
                    "A refresh might do the trick.  If not, try again from the start. If the issue persists, let us know!"
                )
            }

            const addThe = (bulidingName:string) => bulidingName.toLowerCase().startsWith('the') ? bulidingName : `the ${bulidingName}`
            const removeThe = (bulidingName:string) => bulidingName.toLowerCase().startsWith('the') ? bulidingName.substring(4) : bulidingName
            console.log('remove string:', removeThe(building.metadata.name))
            console.log('add string:', addThe(building.metadata.name))
            const successString = `${isSell ? "You've parted with" : "You've acquired"} ${ amount > BigInt(1) ? `${amount} ${removeThe(building.metadata.name)} cards!` : `${addThe(building.metadata.name)} card!`}`

            const shareText = isSell 
                ? `Just sold ${amount > 1 ? `${amount} ${removeThe(building.metadata.name)} cards` : `${addThe(building.metadata.name)} card`} in /farconic! 💰`
                : `Just bought ${amount > 1 ? `${amount} ${removeThe(building.metadata.name)} cards` : `${addThe(building.metadata.name)} card`} in /farconic! 👀`

            const nameWithHyphens = building.metadata.name.replaceAll(/\s/g, '-').toLowerCase()

            const targetUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}%0Ahttps://farconic-mintclub-building-trade.vercel.app?buildingName=${encodeURIComponent(nameWithHyphens)}`

            return {
                image: (
                    <div tw="flex w-full h-full" style={{ backgroundImage: `url(${process.env.NEXT_PUBLIC_GATEWAY_URL}/QmRJx4BNegoXtzsZ64zqFwxqoXUFRZAmAQmG6ToLxU2SdV)`}}>
                        <div tw="flex flex-col relative bottom-[40px] w-full h-full items-center justify-center">
                            <h1 tw="relative top-[18%] text-[60px]">{ isSell ? 'SOLD!' : 'CONGRATULATIONS!' }</h1>
                            { await CardImage(building as NFT, undefined, undefined, '0.50') }
                            { userData && 
                                <div tw="absolute top-[310px] w-full flex flex-col justify-center items-center">
                                    <img src={userData.profileImage} tw="w-[4.55vw] h-[4.55vw] rounded-full" />
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
                    <Button action="post" target="/">
                        Home
                    </Button>,
                    <Button action="link" target={ targetUrl }>
                        Share 🔁
                    </Button>,
                    <Button action="link" target={ url }>
                        View tx
                    </Button>
                ],
                headers: {  
                    "Cache-Control": "max-age=0", 
                },
            }
        } else {
            return {
                image: (
                    <div tw="flex w-full h-full justify-center items-center" style={{ translate: '200%', backgroundSize: '100% 100%', backgroundImage: `url(https://ipfs.filebase.io/ipfs/QmT4qQyVaCaYj5NPSK3RnLTcDp1J7cZpSj4RkVGG1fjAos)`}}>
                        <div tw="flex flex-col absolute px-20 justify-center items-center">
                            <h1 tw="text-[50px] mb-5 leading-6">Transaction Status:</h1>
                            <p tw="text-[30px] leading-6">{receipt.status}</p>                            
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
                    <Button action="post" target={{ query: { transactionId: txId }, pathname: "/trade/txStatusTrade" }}>
                        Refresh
                    </Button>
                ],
                headers: {  
                    "Cache-Control": "max-age=0", 
                },
            }
        }
    } else {
        return ErrorFrame("Transaction Not Found", null, null, "A fresh start might do the trick. If the problem persists, let us know!")
    }
})

export const GET = handleRequest
export const POST = handleRequest