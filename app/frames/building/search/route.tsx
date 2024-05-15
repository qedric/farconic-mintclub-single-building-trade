import { Button } from "frames.js/next"
import { frames } from "../../frames"
import { levenshteinDistance, getOpenseaData, getDetail, NFT } from '@/app/utils'
import buildings from '@/app/data/buildings.json'
import { ethers } from "ethers"

function searchJsonArray(query: string): NFT[] {
    const lowerCaseQuery = query.toLowerCase()
    const matchingElements: NFT[] = []

    for (const element of buildings as NFT[]) {
        const metadataValues = Object.values(element.metadata)
            .filter(value => typeof value === 'string')
            .map(value => (value as string).toLowerCase())
        
        let found = false // Flag to indicate if the element has been found
        for (const value of metadataValues) {
            if (value.includes(lowerCaseQuery) || levenshteinDistance(value, lowerCaseQuery) <= 2) {
                if (!found) {
                    matchingElements.push(element)
                    found = true // Set found flag to true
                }
                break // Stop checking metadata values for this element once a match is found
            }
        }

        for (const attribute of element.metadata.attributes) {
            if (typeof attribute.value === 'string' &&
                (attribute.value.toLowerCase().includes(lowerCaseQuery) ||
                levenshteinDistance(attribute.value.toLowerCase(), lowerCaseQuery) <= 2)) {
                if (!found) {
                    matchingElements.push(element)
                    found = true // Set found flag to true
                }
                break // Stop checking attributes for this element once a match is found
            }
        }
    }

    return matchingElements
}

const handleRequest = frames(async (ctx: any) => {

    let searchTerm = ctx.searchParams?.searchTerm
        ? ctx.searchParams.searchTerm : ctx.message.inputText

    // there is a search term, find matches in the metadata
    if (searchTerm) {
        const searchResults = searchTerm == 'random'
        ? new Array(buildings[Math.floor(Math.random() * buildings.length)])
        : searchJsonArray(searchTerm)

        //console.log('results', searchResults)

        let page: number = ctx.searchParams?.page ? parseInt(ctx.searchParams.page) : 1
        const currentBuilding = searchResults[page-1]
        
        //console.log('currentBuilding:', currentBuilding)

        //console.log('page:', page)
        if (searchResults.length > 0) {
            const [openseaData, detail] = await Promise.all([
                getOpenseaData((currentBuilding as NFT).address),
                getDetail((currentBuilding as NFT).address)
            ])

            //console.log('openseaData', openseaData)
            //console.log('detail', detail)
            return {
                image: (
                    <div tw="flex w-full h-full bg-gray-200 items-center justify-center shadow-2xl">
                        <div tw="flex flex-wrap mx-auto w-3/5 p-8 h-5/6 shadow-2xl bg-pink-700 text-white rounded-lg">
                            <div tw="p-4 flex flex-col items-center justify-center w-full h-4/5 bg-fuchsia-800 border border-yellow-400 rounded-lg">
                                <img tw="w-full object-contain" src={ searchResults[page-1].metadata.image.replace("ipfs://", `${process.env.NEXT_PUBLIC_GATEWAY_URL}`) as string } />
                                <h3 tw="my-2 overflow-hidden break-word">{ searchResults[page-1].metadata.name }</h3>
                            </div>
                            <div tw="my-5 w-full flex justify-between items-center">
                                <div tw="flex text-sm w-1/3 mr-2 p-2 bg-fuchsia-800 border border-yellow-400 rounded-lg">
                                    Liquidity<span tw="px-2 uppercase">{ ethers.formatEther(detail.info.reserveBalance.toString()) }</span>ETH
                                </div>
                                <div tw="flex text-sm w-1/3 mx-2 p-2 bg-fuchsia-800 border border-yellow-400 rounded-lg">
                                    Holders:<span tw="px-2 uppercase">{ openseaData.owners.length }</span>
                                </div>
                                <div tw="flex text-sm w-1/3 ml-2 p-2 bg-fuchsia-800 border border-yellow-400 rounded-lg">
                                    Supply:<span tw="px-2 uppercase">{ detail.info.currentSupply }</span>
                                </div>
                            </div>
                            <div tw="w-full flex justify-between items-center">
                                <div tw="flex text-base w-2/5 mr-4 p-5 bg-fuchsia-800 border border-yellow-400 rounded-lg">
                                    Current Price:<span tw="px-2 uppercase font-bold">{ ethers.formatEther(detail.info.priceForNextMint).toString() }</span>
                                </div>
                                <div tw="flex text-base w-3/5 ml-4 p-5 bg-fuchsia-800 border border-yellow-400 rounded-lg">
                                    City:<span tw="px-2 uppercase font-bold">{ searchResults[page-1].metadata.attributes.find(attr => attr.trait_type == 'City')?.value }</span>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                ),
                imageOptions: {
                    aspectRatio: "1:1",
                },
                textInput: "search",
                buttons: searchResults.length == 1 // just one result
                ?   [
                        <Button action="post" target={{ query: { building: JSON.stringify(currentBuilding) }, pathname: "/building/trade/buy" }}>
                            Buy
                        </Button>,
                        <Button action="post" target={{ query: { building: JSON.stringify(currentBuilding) }, pathname: "/building/trade/sell" }}>
                            Sell
                        </Button>,
                        <Button action="post" target="/building/search">
                            Search
                        </Button>,
                        <Button action="post" target={{ query: { searchTerm: 'random' }, pathname: "/building/search" }}>
                            Random
                        </Button>
                    ]
                :   page > 1 && searchResults.length > page // multiple results and we are somewhere in the middle
                    ?   [
                            <Button action="post" target={{ query: { building: JSON.stringify(currentBuilding) }, pathname: "/building/trade/buy" }}>
                                Buy
                            </Button>,
                            <Button action="post" target={{ query: { building: JSON.stringify(currentBuilding) }, pathname: "/building/trade/sell" }}>
                                Sell
                            </Button>,
                            <Button action="post" target={{ query: { page: page-1, searchTerm: searchTerm }, pathname: "/building/search" }}>
                                Prev
                            </Button>,
                            <Button action="post" target={{ query: { page: page+1, searchTerm: searchTerm }, pathname: "/building/search" }}>
                                Next
                            </Button>
                        ]
                    :   page > 1 && searchResults.length == page // multiple results and we are at the end
                        ?   [
                                <Button action="post" target={{ query: { building: JSON.stringify(currentBuilding) }, pathname: "/building/trade/buy" }}>
                                    Buy
                                </Button>,
                                <Button action="post" target={{ query: { building: JSON.stringify(currentBuilding) }, pathname: "/building/trade/sell" }}>
                                    Sell
                                </Button>,
                                <Button action="post" target={{ query: { page: page-1, searchTerm: searchTerm }, pathname: "/building/search" }}>
                                    Prev
                                </Button>,
                                <Button action="post" target="/building/search">
                                    Search
                                </Button>
                            ]
                        :   [ // multiple results and we are at the start
                                <Button action="post" target={{ query: { building: JSON.stringify(currentBuilding) }, pathname: "/building/trade/buy" }}>
                                    Buy
                                </Button>,
                                <Button action="post" target={{ query: { building: JSON.stringify(currentBuilding) }, pathname: "/building/trade/sell" }}>
                                    Sell
                                </Button>,
                                <Button action="post" target={{ query: { page: page+1, searchTerm: searchTerm }, pathname: "/building/search" }}>
                                    Next
                                </Button>,
                                <Button action="post" target="/building/search">
                                    Search
                                </Button>
                            ]

            }
        } else { // no results
            return { 
                image: (
                    <div tw="flex flex-col items-center justify-center">
                        <h3>Nothing came up!</h3>
                        <h4>try Berlin, that always works</h4>
                    </div>
                ),
                imageOptions: {
                    aspectRatio: "1:1",
                },
                textInput: "search",
                buttons: [
                    <Button action="post" target="/building/search">
                        Search
                    </Button>,
                    <Button action="post" target={{ query: { searchTerm: 'random' }, pathname: "/building/search" }}>
                        Random
                    </Button>,
                    <Button action="post" target="/">
                        Reset
                    </Button>
                ]
            }
        }
    }

    return { 
        image: (
            <div tw="px-5 mx-auto flex flex-col items-center justify-center">
                <h3>Search for a building</h3>
                <h4 tw="text-center">or enter a keyword like 'bridge', 'Shanghai', or perhaps 'magnificent Flemish Renaissance style building'</h4>
            </div>
        ),
        imageOptions: {
            aspectRatio: "1:1",
        },
        textInput: "search",
        buttons: [
            <Button action="post" target="/building/search">
                Search
            </Button>,
            <Button action="post" target={{ query: { searchTerm: 'random' }, pathname: "/building/search" }}>
                Random
            </Button>,
            <Button action="post" target="/">
                Reset
            </Button>
        ]
    }
})

export const GET = handleRequest
export const POST = handleRequest