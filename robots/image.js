const google = require('googleapis').google
const customSearch = google.customsearch('v1')
const state = require('./state.js')

const googleSearchCredentials = require('../credentials/google-search.json')

async function robot(){
    const content = state.load()
    
    await buscarImagensDasSentencas(content);
    
    state.save(content)

    async function buscarImagensDasSentencas(content) {
        for (const sentence of content.sentences) {
            const query = `${content.searchTerm} ${sentence.keywords[0]}`
            sentence.images = await buscarLinksImagensGoogle(query)

            sentence.googleSearchQuery = query
        }
    }

    async function buscarLinksImagensGoogle(query) {
        const response = await customSearch.cse.list({
            auth: googleSearchCredentials.apikey,
            cx: googleSearchCredentials.searchEngineId,
            q: query,
            searchType: 'image',
            num: 2
        })
        const imageURL = response.data.items.map((item) => {
            return item.link
        })
        return imageURL
    }    
}

module.exports = robot