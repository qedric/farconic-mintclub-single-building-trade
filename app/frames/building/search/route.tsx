import { Button } from "frames.js/next"
import { frames } from "../../frames"
import { levenshteinDistance, Metadata, Attribute, NFT } from '@/app/utils'
import buildings from '@/app/data/buildings.json'

function searchJsonArray(query: string): NFT[] {
    const lowerCaseQuery = query.toLowerCase();
    const matchingElements: NFT[] = [];

    for (const element of buildings as NFT[]) {
        const metadataValues = Object.values(element.metadata)
            .filter(value => typeof value === 'string')
            .map(value => (value as string).toLowerCase());
        
        let found = false; // Flag to indicate if the element has been found
        for (const value of metadataValues) {
            if (value.includes(lowerCaseQuery) || levenshteinDistance(value, lowerCaseQuery) <= 2) {
                if (!found) {
                    matchingElements.push(element);
                    found = true; // Set found flag to true
                }
                break; // Stop checking metadata values for this element once a match is found
            }
        }

        for (const attribute of element.metadata.attributes) {
            if (typeof attribute.value === 'string' &&
                (attribute.value.toLowerCase().includes(lowerCaseQuery) ||
                levenshteinDistance(attribute.value.toLowerCase(), lowerCaseQuery) <= 2)) {
                if (!found) {
                    matchingElements.push(element);
                    found = true; // Set found flag to true
                }
                break; // Stop checking attributes for this element once a match is found
            }
        }
    }

    return matchingElements;
}

const handleRequest = frames(async (ctx: any) => {

    console.log('search term from query param: ', ctx.searchParams?.searchTerm)

    let searchTerm = ctx.searchParams?.searchTerm
        ? ctx.searchParams.searchTerm : ctx.message.inputText

    // search for the building or city
    if (searchTerm) {
        const searchResults = searchTerm == 'random'
        ? new Array(buildings[Math.floor(Math.random() * buildings.length)])
        : searchJsonArray(searchTerm)
        let page: number = ctx.searchParams?.page ? parseInt(ctx.searchParams.page) : 1
        const currentBuilding = searchResults[page-1]
        //console.log('currentBuilding:', currentBuilding)
        //console.log('searchTerm:', searchTerm)
        //console.log('page:', page)
        if (searchResults.length > 0) {
            return {
                image: searchResults[page-1].metadata.image.replace("ipfs://", `${process.env.NEXT_PUBLIC_GATEWAY_URL}`) as string,
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