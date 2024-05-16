/* eslint-disable react/jsx-key */
import { Button } from "frames.js/next"
import { frames } from "./frames"

const handleRequest = frames(async (ctx) => {

    return {
        image: (
            <div tw="flex w-full h-full bg-gray-200 items-center justify-center shadow-2xl">
                <h1>?</h1>
            </div>
        ),
        imageOptions: {
            aspectRatio: "1:1",
        },
        textInput: "search e.g. \"bridge\" or \"Rome\"",
        buttons: [
            <Button action="post" target="/building/search">
                Search
            </Button>,
            <Button action="link" target={process.env.NEXT_PUBLIC_MORE_INFO_LINK as string}>
                Farconic
            </Button>,
            <Button action="link" target={process.env.NEXT_PUBLIC_MORE_INFO_LINK as string}>
                My Cards / Learn more
            </Button>
        ]
    }
})

export const GET = handleRequest
export const POST = handleRequest