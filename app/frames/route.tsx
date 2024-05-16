/* eslint-disable react/jsx-key */
import { Button } from "frames.js/next"
import { frames } from "./frames"

export const maxDuration = 60

const handleRequest = frames(async (ctx) => {

    return {
        image: (
            <div tw="flex">
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
            </Button>
        ]
    }
})

export const GET = handleRequest
export const POST = handleRequest