/* eslint-disable react/jsx-key */
import { Button } from "frames.js/next"
import { frames } from "./frames"
import buildings from "@/app/data/buildings.json"
import { CardImage } from '@/app/components/Card'
import { getRandomBuildingAmongFavourites } from '@/app/utils'

export const maxDuration = 20

const handleRequest = frames(async (ctx) => {

    const building = getRandomBuildingAmongFavourites()

    return {
        image: await CardImage( building ),
        imageOptions: {
            aspectRatio: "1:1",
        },
        textInput: "search e.g. \"bridge\" or \"Rome\"",
        buttons: [
            <Button action="post" target={{ query: { building: JSON.stringify(building) }, pathname: "/building/trade" }}>
                Buy
            </Button>,
            <Button action="post" target="/building/search">
                Search
            </Button>,
            <Button action="post" target={{ query: { building: JSON.stringify(getRandomBuildingAmongFavourites(building.metadata.name)) }, pathname: "/building/card" }}>
                Random
            </Button>,
            <Button action="link" target={process.env.NEXT_PUBLIC_MORE_INFO_LINK as string}>
                Farconic App
            </Button>
        ]
    }
})

export const GET = handleRequest
export const POST = handleRequest