/* eslint-disable react/jsx-key */
import { Button } from "frames.js/next"
import { frames } from "./frames"
import { CardImage } from '@/app/components/Card'
import { getRandomBuildingAmongFavourites } from '@/app/utils'
import * as fs from "node:fs/promises"
import * as path from "node:path"

const quicksandBoldFont = fs.readFile(
    path.join(path.resolve(process.cwd(), "public"), "Quicksand-Bold.ttf")
) 

export const maxDuration = 20

const handleRequest = frames(async (ctx) => {

    const quicksandBoldData = await quicksandBoldFont

    const building = ctx.searchParams?.building ? JSON.parse(ctx.searchParams?.building) : getRandomBuildingAmongFavourites()

    return {
        image: await CardImage( building ),
        imageOptions: {
            aspectRatio: "1:1",
            fonts: [
                {
                  name: "QuicksandBold",
                  data: quicksandBoldData,
                  weight: 700,
                }
            ]
        },
        textInput: "search e.g. \"bridge\" or \"Rome\"",
        buttons: [
            <Button action="post" target={{ query: { building: JSON.stringify(building) }, pathname: "/trade" }}>
                Buy
            </Button>,
            <Button action="post" target="/search">
                Search
            </Button>,
            <Button action="post" target={{ query: { building: JSON.stringify(getRandomBuildingAmongFavourites(building.metadata.name)) }, pathname: "/" }}>
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