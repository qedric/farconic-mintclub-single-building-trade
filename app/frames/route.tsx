/* eslint-disable react/jsx-key */
import { Button } from "frames.js/next"
import { frames } from "./frames"

const handleRequest = frames(async (ctx) => {

    /* 
        <Button action="post" target={{ query: { building: JSON.stringify(buildings[11]) }, pathname: "/building/trade" }}>
            Get Building
        </Button>, 
    */

    return {
        image: `${process.env.NEXT_PUBLIC_GATEWAY_URL}QmdG2bYfgavL1qcc2qduvD62DjaFpaMZqkX8TfXYoCCEiC/2.jpeg`,
        imageOptions: {
            aspectRatio: "1:1",
        },
        buttons: [
            <Button action="post" target="/building/search">
                Get Building
            </Button>,
            <Button action="post" target="/city/check">
                Claim City
            </Button>,
            <Button action="link" target={process.env.NEXT_PUBLIC_MORE_INFO_LINK as string}>
                Learn More
            </Button>,
            <Button action="post" target="/">
                My Buidings & Cities
            </Button>
        ]
    }
})

export const GET = handleRequest
export const POST = handleRequest