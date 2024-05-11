/* eslint-disable react/jsx-key */
import { Button } from "frames.js/next"
import { frames } from "../../frames"
import { Element } from '@/app/utils'

const handleRequest = frames(async (ctx) => {
    
    if (ctx.searchParams?.building) {

        const building:Element = JSON.parse(ctx.searchParams.building)

        return {
            image: building.metadata.image.replace("ipfs://", `${process.env.NEXT_PUBLIC_GATEWAY_URL}`) as string,
            imageOptions: {
                aspectRatio: "1:1",
            },
            buttons: [
                <Button action="post" target={{ query: { building: JSON.stringify(building) }, pathname: "/building/trade/buy" }}>
                    Buy
                </Button>,
                <Button action="post" target="/">
                    Sell
                </Button>,
                <Button action="link" target={process.env.NEXT_PUBLIC_OPENSEA_LINK as string}>
                    view on opensea
                </Button>
            ],
            textInput: 'Quantity - TO DO: show buy price'
        }
    } else {
        return {
            image: (
                <div>error can't find building</div>
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