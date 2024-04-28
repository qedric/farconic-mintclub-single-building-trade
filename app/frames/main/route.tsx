/* eslint-disable react/jsx-key */
import { Button } from "frames.js/next"
import { frames } from "../frames"

const handleRequest = frames(async (ctx) => {

    return {
        image: `${process.env.NEXT_PUBLIC_GATEWAY_URL}QmdG2bYfgavL1qcc2qduvD62DjaFpaMZqkX8TfXYoCCEiC/2.jpeg`,
        imageOptions: {
            aspectRatio: "1:1",
        },
        buttons: [
            <Button action="post" target="/building">
                mint 5 buildings
            </Button>,
            <Button action="post" target="/city/check">
                mint city
            </Button>,
            <Button action="link" target={process.env.NEXT_PUBLIC_OPENSEA_LINK as string}>
                view on opensea
            </Button>
        ]
    }
})

export const GET = handleRequest
export const POST = handleRequest