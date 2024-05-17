/* eslint-disable react/jsx-key, @next/next/no-img-element, jsx-a11y/alt-text */
import { Button } from "frames.js/next"
import { frames } from "../frames"
import { NFT } from '@/app/utils'
import { CardImage } from '@/app/components/Card'

const handleRequest = frames(async (ctx) => {
    
    if (ctx.searchParams?.building) {

        const building:NFT = JSON.parse(ctx.searchParams.building)

        return {
            image: await CardImage( building ),
            imageOptions: {
                aspectRatio: "1:1",
            },
            buttons: [
                <Button action="post" target={{ query: { building: JSON.stringify(building) }, pathname: "/trade/confirm" }}>
                    Buy
                </Button>,
                <Button action="post" target={{ query: { building: JSON.stringify(building), isSell: true }, pathname: "/trade" }}>
                    Sell
                </Button>,
                <Button action="post" target={{ query: { building: JSON.stringify(building) }, pathname: "/card" }}>
                    Back
                </Button>
            ],
            textInput: 'Quantity'
        }
    } else {
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
                <Button action="link" target={process.env.NEXT_PUBLIC_OPENSEA_LINK as string}>
                    view on opensea
                </Button>
            ]
        }
    }
})

export const GET = handleRequest
export const POST = handleRequest