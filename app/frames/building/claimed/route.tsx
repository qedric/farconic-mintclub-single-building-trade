/* eslint-disable react/jsx-key */
import { Button } from "frames.js/next"
import { frames } from "../../frames"
import { decodeEventLog, Abi } from 'viem'
import { fetchImageUrlFromIPFS, getTransactionReceipt } from '@/app/utils'
import abi from '@/app/data/abi.json'

const errorResponse = (message: string) => {
    return {
        image: (
            <div tw="flex flex-col">
                <p tw="m-8">{message}</p>
            </div>
        ),
        imageOptions: {
            aspectRatio: "1:1",
        },
        buttons: [
            <Button action="post" target="/">
                reset
            </Button>,
            <Button action="link" target={process.env.NEXT_PUBLIC_OPENSEA_LINK as string}>
                view on opensea
            </Button>
        ]
    }
}

const handleRequest = frames(async (ctx: any) => {

    let ipfsLinks:string[] = ctx.searchParams?.ipfsLinks || null
    let txReceipt:any = ctx.searchParams?.txReceipt || null
    let requestStatus:any = ctx.searchParams?.requestStatus || null
    const txId = ctx.txId
                ? ctx.txId
                : ctx.searchParams?.txId || ''
    
    if(!ipfsLinks) {
        if(!txReceipt) {
            if(!requestStatus){

                console.log('txId:', txId)
                if(!txId) {
                    errorResponse('Can\'t find a transaction')
                }

                // if we have a txId, get the tx status
                const options = {method: 'GET', headers: {Authorization: `Bearer ${process.env.SYNDICATE_API_KEY}`}}
                await fetch(`https://api.syndicate.io/wallet/project/${process.env.SYNDICATE_PROJECT_ID}/request/${txId}`, options)
                .then(response => response.json())
                .then(response => requestStatus = response)
                .catch(err => errorResponse(`Error getting request status: ${err}`))
                //console.log('tx status:', requestStatus)
            }

            if (requestStatus.invalid) {
                errorResponse('Sorry you can\'t claim at this time')
            }

            let status:string
            try {
                txReceipt = requestStatus.transactionAttempts[0]?.hash
                ? await getTransactionReceipt(requestStatus.transactionAttempts[0]?.hash)
                : null
            } catch (err) {
                errorResponse(`Error getting transaction receipt: ${err}`)
            }
        }

        if (txReceipt?.status == 'success') {

            const eventABI = (abi.filter((item: any) => item.name === "TokensClaimed") as Abi)
            const logs = txReceipt.logs
            const tokenIds:number[] = []
    
            // Filter logs to find TokensClaimed events
            logs.forEach((log:any) => {
                try {
                    const topics:any = decodeEventLog({abi: eventABI, data: log.data, topics: log.topics})
                    tokenIds.push(topics.args.tokenId)
                } catch {
                    // not a TokensClaimed event, do nothing
                }
            })
    
            try {
                // Extract tokenIds and call fetchImageUrlFromIPFS for each tokenId
                ipfsLinks = await Promise.all(tokenIds.map(async (tokenId:any) => 
                    fetchImageUrlFromIPFS(`${process.env.NEXT_PUBLIC_IPFS_ROOT_BUILDINGS}/${tokenId}`)
                ))
            } catch (err) {
                errorResponse(`Error getting IPFS links: ${err}`)
            }
            
        }

    }

    return txReceipt?.status == 'success' ? {
        image: (
            <div tw="flex flex-col w-full h-full">
                <div tw="flex flex-col bg-black">
                    <h1 tw="m-0 p-0 mx-auto text-white">YOUR NFT/BUILDINGS</h1>
                </div>
                <div tw="flex flex-wrap justify-center mx-auto h-full mt-24">
                    <img
                        tw="m-8 shadow-lg"
                        src={`${ipfsLinks[0]}`}
                        width={220}
                    />
                    <img
                        tw="m-8 shadow-lg"
                        src={`${ipfsLinks[1]}`}
                        width={220}
                    />
                    <img
                        tw="m-8 shadow-lg"
                        src={`${ipfsLinks[2]}`}
                        width={220}
                    />
                    <img
                        tw="m-8 shadow-lg"
                        src={`${ipfsLinks[3]}`}
                        width={220}
                    />
                    <img
                        tw="absolute bottom-1/2 shadow-2xl"
                        src={`${ipfsLinks[4]}`}
                        width={220}
                    />
                </div>
            </div>
        ),
        imageOptions: {
            aspectRatio: "1:1",
        },
        buttons: [
            <Button action="post" target="/">
                reset
            </Button>,
            <Button action="link" target={process.env.NEXT_PUBLIC_OPENSEA_LINK as string}>
                view on opensea
            </Button>,
            <Button action="link" target='https://farconic.xyz'>
                learn more
            </Button>
        ]
    } : (
        txReceipt?.status == 'pending' ? {
            image: (
                <div tw="flex flex-col">
                    <h1>{`Transaction pending`}</h1>
                    <p>Wait a moment then hit refresh</p>
                </div>
            ),
            imageOptions: {
                aspectRatio: "1:1",
            },
            buttons: [
                <Button action="post" target={{ query: { txId: txId, requestStatus: requestStatus, txReceipt:txReceipt, ipfsLinks: ipfsLinks }, pathname: "/building/claimed" }}>
                    refresh
                </Button>,
                <Button action="link" target={process.env.NEXT_PUBLIC_OPENSEA_LINK as string}>
                    view on opensea
                </Button>
            ]
        }: {
            image: (
                <div tw="flex flex-col">
                    <h1>{`Transaction status: ${txReceipt?.status}.`}</h1>
                </div>
            ),
            imageOptions: {
                aspectRatio: "1:1",
            },
            buttons: [
                <Button action="post" target={{ query: { txId: txId, requestStatus: requestStatus, txReceipt:txReceipt, ipfsLinks: ipfsLinks }, pathname: "/building/claimed" }}>
                    refresh
                </Button>,
                <Button action="post" target="/">
                    reset
                </Button>,
                <Button action="link" target={process.env.NEXT_PUBLIC_OPENSEA_LINK as string}>
                    view on opensea
                </Button>
            ]
        }
    )
   
})

export const GET = handleRequest
export const POST = handleRequest