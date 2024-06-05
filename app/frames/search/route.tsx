/* eslint-disable react/jsx-key, @next/next/no-img-element, jsx-a11y/alt-text */
import { Button } from "frames.js/next"
import { frames } from "../frames"
import { searchJsonArray, getFavouriteBuildings, getNFTBalance } from '@/app/utils'
import { CardImage } from '@/app/components/Card'
import { getUserDataForFid } from 'frames.js'
import { error } from "frames.js/core"

const handleRequest = frames(async (ctx: any) => {

    let searchTerm = ctx.searchParams?.searchTerm || ctx.message.inputText

    // there is a search term, find matches in the metadata
    if (searchTerm) {
        const searchResults = searchJsonArray(searchTerm)

        //console.log('results', searchResults)

        let page: number = ctx.searchParams?.page ? parseInt(ctx.searchParams.page) : 1
        
        //console.log('currentBuilding:', currentBuilding)
        //console.log('page:', page)

        if (searchResults.length == 0) {
            console.log('no results')
            // add getFavouriteBuildings() to the search results
            searchResults.push(...getFavouriteBuildings())
        }

        const building = searchResults[page-1]

        let userAddress = ctx.message?.connectedAddress
        if (!userAddress) {
            userAddress = ctx.message?.requesterVerifiedAddresses?.[0]
            if (!userAddress) {
                error("Please connect your wallet to see balance")
            }
        }

        const userData = await getUserDataForFid({ fid: (ctx.message?.requesterFid as number) })

        const balance:bigint = (await getNFTBalance((building.address as `0x${string}`), userAddress as `0x${string}` ) as bigint)
        console.log(`balance:`, balance)

        return {
            image: await CardImage( searchResults[page-1], userData?.profileImage, userData?.username, undefined),
            imageOptions: {
                aspectRatio: "1:1",
            },
            textInput: "Search, or Enter Quantity",
            buttons: searchResults.length == 1 // just one result
            ?   [
                    <Button action="post" target={{ query: { building: JSON.stringify(building) }, pathname: "/trade/" }}>
                        Buy
                    </Button>,
                    <Button action="post" target={ balance > 0 ? { query: { building: JSON.stringify(building), isSell:true }, pathname: "/trade/" } : "/" }>
                        { balance > 0 ? 'Sell' : 'Home' }
                    </Button>,
                    <Button action="post" target={{ query: { searchTerm: 'random' }, pathname: "/search" }}>
                        Random
                    </Button>,
                    <Button action="post" target="/search">
                        Search
                    </Button>
                ]
            :   page > 1 && searchResults.length > page // multiple results and we are somewhere in the middle
                ?   [
                        <Button action="post" target={{ query: { building: JSON.stringify(building) }, pathname: "/trade/" }}>
                            { balance > 0 ? 'Trade' : 'Buy' }
                        </Button>,
                        <Button action="post" target={{ query: { page: page-1, searchTerm: searchTerm }, pathname: "/search" }}>
                            Prev
                        </Button>,
                        <Button action="post" target={{ query: { page: page+1, searchTerm: searchTerm }, pathname: "/search" }}>
                            Next
                        </Button>,
                        <Button action="post" target="/search">
                            Search
                        </Button>
                    ]
                :   page > 1 && searchResults.length == page // multiple results and we are at the end
                    ?   [
                            <Button action="post" target={{ query: { building: JSON.stringify(building) }, pathname: "/trade/" }}>
                                Buy
                            </Button>,
                            <Button action="post" target={ balance > 0 ? { query: { building: JSON.stringify(building), isSell:true }, pathname: "/trade/" } : "/" }>
                                { balance > 0 ? 'Sell' : 'Home' }
                            </Button>,
                            <Button action="post" target={{ query: { page: page-1, searchTerm: searchTerm }, pathname: "/search" }}>
                                Prev
                            </Button>,
                            <Button action="post" target="/search">
                                Search
                            </Button>
                        ]
                    :   [ // multiple results and we are at the start
                            <Button action="post" target={{ query: { building: JSON.stringify(building) }, pathname: "/trade/" }}>
                                Buy
                            </Button>,
                            <Button action="post" target={ balance > 0 ? { query: { building: JSON.stringify(building), isSell:true }, pathname: "/trade/" } : "/" }>
                                { balance > 0 ? 'Sell' : 'Home' }
                            </Button>,
                            <Button action="post" target={{ query: { page: page+1, searchTerm: searchTerm }, pathname: "/search" }}>
                                Next
                            </Button>,
                            <Button action="post" target="/search">
                                Search
                            </Button>
                        ],
                        headers: {  
                            "Cache-Control": "max-age=0", 
                        },
        }
    }

    return { 
        image: (
            <div tw="flex w-full h-full" style={{ translate: '200%', backgroundSize: '100% 100%', backgroundImage: `url(https://ipfs.filebase.io/ipfs/QmT4qQyVaCaYj5NPSK3RnLTcDp1J7cZpSj4RkVGG1fjAos)`}}>
                <div tw="flex flex-col px-20 justify-center items-center">
                    <h1 tw="text-[50px] mb-5 leading-6">Search for a building</h1>
                    <p tw="text-[30px] text-center">or enter a keyword like &apos;bridge&apos;, &apos;Shanghai&apos;, or perhaps &apos;magnificent Flemish Renaissance style building&apos;</p>
                </div>
            </div>
        ),
        imageOptions: {
            aspectRatio: "1:1",
        },
        textInput: "search",
        buttons: [
            <Button action="post" target={{ query: { searchTerm: 'random' }, pathname: "/search" }}>
                Random
            </Button>,
            <Button action="post" target="/">
                Home
            </Button>,
            <Button action="link" target="https://farconic.xyz">
                App
            </Button>,
            <Button action="post" target="/search">
                Search
            </Button>
        ],
        headers: {  
            "Cache-Control": "max-age=0", 
        },
    }
})

export const GET = handleRequest
export const POST = handleRequest