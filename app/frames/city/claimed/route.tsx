/* eslint-disable react/jsx-key */
import { Button } from "frames.js/next"
import { frames } from "../../frames"
import { fetchImageUrlFromTokenId } from '@/app/utils'
import { claimCity } from "@/app/frames/claim"

const handleRequest = frames(async (ctx: any) => {

    const txId = '016e1209-cf41-469b-a519-2e66b2df4381'

    const options = {method: 'GET', headers: {Authorization: `Bearer ${process.env.SYNDICATE_API_KEY}`}};
    let txStatus:any

    await fetch(`https://api.syndicate.io/wallet/project/${process.env.SYNDICATE_PROJECT_ID}/request/${txId}`, options)
    .then(response => response.json())
    .then(response => txStatus = response)
    .catch(err => console.error(err))

    console.log('tx status:', txStatus)

    const confirmed = txStatus?.transactionAttempts?.some((attempt:any) => attempt.status == 'CONFIRMED')

    return confirmed ? { 
        image: await fetchImageUrlFromTokenId(10),
        imageOptions: {
            aspectRatio: "1:1",
        },
        buttons: [
            <Button action="link" target={process.env.NEXT_PUBLIC_OPENSEA_LINK as string}>
                view on opensea
            </Button>
        ]
    } : {
        image: (
            <div tw="flex">
                <h1>Transaction pending.</h1>
                <p>Wait a moment then hit refresh</p>
            </div>
        ),
        imageOptions: {
            aspectRatio: "1:1",
        },
        buttons: [
            <Button action="post" target={{ query: { txId: txId }, pathname: "/city/claimed" }}>
                refresh
            </Button>,
            <Button action="link" target={process.env.NEXT_PUBLIC_OPENSEA_LINK as string}>
                view on opensea
            </Button>
        ]
    }
})

export const GET = handleRequest
export const POST = handleRequest