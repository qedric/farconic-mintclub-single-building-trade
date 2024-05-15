/* eslint-disable react/jsx-key */
import { Button } from "frames.js/next"
import { frames } from "../../frames"
import { NFT, getOpenseaData, getDetail } from '@/app/utils'
import { CardImage } from '@/app/components/Card'

const handleRequest = frames(async (ctx) => {
    
    if (ctx.searchParams?.buildingNFT) {

        const building:NFT = JSON.parse(ctx.searchParams.buildingNFT)

        const [openseaData, detail] = await Promise.all([
            getOpenseaData((building as NFT).address),
            getDetail((building as NFT).address)
        ])

        return {
            image: await CardImage( building ),
            imageOptions: {
                aspectRatio: "1:1",
            },
            buttons: [
                <Button action="post" target={{ query: { building: JSON.stringify(building) }, pathname: "/building/card/trade" }}>
                    Buy
                </Button>,
                <Button action="post" target={{ query: { building: JSON.stringify(building), isSell:true }, pathname: "/building/card/trade" }}>
                    Sell
                </Button>,
                <Button action="link" target={process.env.NEXT_PUBLIC_MORE_INFO_LINK as string}>
                    Farconic App
                </Button>,
                <Button action="post" target='/'>
                    Home
                </Button>
            ],
            textInput: 'Quantity'
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