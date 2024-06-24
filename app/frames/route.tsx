/* eslint-disable react/jsx-key */
import { Button } from "frames.js/next"
import { frames } from "./frames"
import { getUserDataForFid } from 'frames.js'
import { CardImage } from '@/app/components/Card'
import { getRandomBuildingAmongFavourites, getBuildingByName, NFT } from '@/app/utils'

export const maxDuration = 20

const handleRequest = frames(async (ctx) => {

    let building: NFT = ctx.searchParams.building
        ? JSON.parse(ctx.searchParams.building)
        : ctx.searchParams.buildingName
            ? getBuildingByName(ctx.searchParams?.buildingName?.replaceAll('-', ' ')) || getRandomBuildingAmongFavourites()
            : getRandomBuildingAmongFavourites()
    
    const userData = await getUserDataForFid({ fid: (ctx.message?.requesterFid as number) })

    const addThe = (bulidingName:string) => bulidingName.toLowerCase().startsWith('the') ? bulidingName : `the ${bulidingName}`
    const shareText = `Check out ${addThe(building.metadata.name)} card in /farconic! 👀`
    const nameWithHyphens = building.metadata.name.replaceAll(/\s/g, '-').toLowerCase()
    const targetUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}%0Ahttps://farconic-mintclub-building-trade.vercel.app?buildingName=${encodeURIComponent(nameWithHyphens)}`

    return {
        image: await CardImage( building, userData?.profileImage, userData?.username, undefined),
        imageOptions: {
            aspectRatio: "1:1"
        },
        textInput: 'Set Quantity',
        buttons: [
            <Button action="link" target={process.env.NEXT_PUBLIC_APP_LINK as string}>
                App 🌐
            </Button>,
            <Button action="post" target={{ query: { building: JSON.stringify(building) }, pathname: "/trade" }}>
                Buy 🛒
            </Button>,
            <Button action="post" target={{ query: { building: JSON.stringify(building), isSell:true }, pathname: "/trade" }}>
                Sell 💰
            </Button>,
            <Button action="link" target={ targetUrl }>
                Share 🔁
            </Button>,
        ],
        headers: {  
            "Cache-Control": "max-age=0", 
        }
    }
})

export const GET = handleRequest
export const POST = handleRequest