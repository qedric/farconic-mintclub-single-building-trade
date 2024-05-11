/* eslint-disable react/jsx-key */
import { Button } from "frames.js/next"
import { frames } from "./frames"
import buildings from '@/app/data/buildings.json'

const handleRequest = frames(async (ctx) => {

    return {
        image: (
            <div tw="m-24 flex flex-col justify-center items-center w-full h-full">
                <div tw="flex bg-black text-white">
                    <h1>F A R C O N I C S</h1>
                    <p>Shapes of Cities</p>
                </div>
            </div>
        ),
        imageOptions: {
            aspectRatio: "1:1",
        },
        buttons: [
            <Button action="post" target={{ query: { building: JSON.stringify(buildings[11]) }, pathname: "/building/trade" }}>
                Buy / Sell / Trade
            </Button>,
            <Button action="link" target={process.env.NEXT_PUBLIC_OPENSEA_LINK as string}>
                view on opensea
            </Button>
        ]
    }
})

export const GET = handleRequest
export const POST = handleRequest