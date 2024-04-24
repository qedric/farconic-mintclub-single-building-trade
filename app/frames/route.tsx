/* eslint-disable react/jsx-key */
import { Button } from "frames.js/next"
import { frames } from "./frames"
import { createPublicClient, http, parseEventLogs, ParseEventLogsReturnType, Log } from 'viem'
import { baseSepolia } from 'viem/chains'
import abi from '../data/abi.json'

const client = createPublicClient({
    chain: baseSepolia,
    transport: http(),
})

const handleRequest = frames(async (ctx) => {

    const fetchImageUrl = async (id: number) => {
        const ipfs_link: string = await client.readContract({
            address: `0x${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string}`,
            abi: abi,
            functionName: 'uri',
            args: [id]
        }) as string
        // get the image value from the metadata resolved by the ipfs link
        const metadata = await fetch(ipfs_link.replace("ipfs://", "https://ipfs.io/ipfs/") as string)
        const json = await metadata.json()
        //console.log(json)
        return json.image.replace("ipfs://", "https://ipfs.io/ipfs/")
    }

    let txId = ctx.message?.transactionId
        ? ctx.message.transactionId 
        : ctx.searchParams.tx
            ? ctx.searchParams.tx
            : '' // assign a valid tx here for testing, or empty string for prod

    console.log(txId)

    if (txId) {
        let receipt = null
        let decimalValues:number[] = []
        try {
            // frames have 5 second timeout, so set a race to skip the wait before the timeout
            receipt = await Promise.race([
                client.waitForTransactionReceipt({ hash: txId as `0x${string}`}),
                new Promise((resolve) => setTimeout(resolve, 3200))
            ])

            const logs = parseEventLogs({ 
                abi: abi, 
                logs: (receipt as { logs: ParseEventLogsReturnType }).logs
            })

            // for each log with the event name 'TokensClaimed', get the value of the 'tokenId' arg
            logs.forEach((log:any) => {
                if (log.eventName === 'TokensClaimed') {
                    decimalValues.push(log.args.tokenId)
                }
            })
        } catch (error) {
            console.log(error)
            // do nothing if an error occurs, user can click refresh to try again
        }
        
        return {
            image: decimalValues.length > 0 ? (
                await fetchImageUrl(decimalValues[1])
            ) : (
                <div tw="p-5 bg-purple-800 text-white w-full h-full justify-center items-center flex">
                    transaction submitted, click refresh to check the status
                </div>
            ),
            imageOptions: {
                aspectRatio: "1:1",
            },
            buttons: receipt ? [
                <Button
                    action="link"
                    target={`https://basescan.org/tx/${ctx.message?.transactionId}`}
                >
                    view on block explorer
                </Button>
            ] : [
                <Button
                    action="post"
                    target={{ query: { tx: txId }, pathname: "/" }}
                >
                    refresh
                </Button>
            ],
        }
    }

    return {
        image: (
            <div tw="bg-rose-200 flex justify-center items-center w-full h-full">
                <div tw="p-6 bg-purple-900 text-white w-3/4 h-3/4 justify-center items-center flex flex-col">
                    <h1 tw="mb-0">C I T I E S</h1>
                    <h4 tw="mt-2 text-center">testing</h4>
                    <h2>mint 5 buildings.</h2>
                    <div tw="flex flex-col bg-rose-200 text-purple-900 px-12 py-2 rounded-full text-center">
                        <p>combine all buildings from one city, into a city NFT.</p>
                    </div>
                </div>
            </div>
        ),
        imageOptions: {
            aspectRatio: "1:1",
        },
        buttons: [
            <Button action="tx" target="/txdata" post_url="/">
                mint 5 buildings
            </Button>,
            <Button action="link" target="https://testnets.opensea.io/collection/farconic-cities-v0-1">
                view on opensea
            </Button>
        ]
    }
})

export const GET = handleRequest
export const POST = handleRequest