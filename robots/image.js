const imageDownloader = require('image-downloader')

const google = require('googleapis').google
const customSearch = google.customsearch('v1')
const state = require('./state.js')

const googleSearchCredentials = require('../credentials/google-search.json')

async function robot() {
    const content = state.load()

    await buscarImagensDasSentencas(content)
    await baixarTodasImagens(content)

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

    async function baixarTodasImagens(content) {
        content.downloadedImages = []

        for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
            const images = content.sentences[sentenceIndex].images

            for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
                const imageUrl = images[imageIndex]

                try {
                    if (content.downloadedImages.includes(imageUrl)) {
                        throw new Error('Image já foi baixada')
                    }

                    await baixarSalvarImagens(imageUrl, `${sentenceIndex}-original.png`)
                    content.downloadedImages.push(imageUrl)
                    console.log(`> Imagem descarregada com sucesso: ${imageUrl}`)
                    break
                } catch (error) {
                    console.log(`> Erro ao descarregar imagem: ' ${error}`)
                }
            }
        }
    }

    async function baixarSalvarImagens(url, fileName) {
        return imageDownloader.image({
            url, url,
            dest: `./content/${fileName}`
        })
    }
}

module.exports = robot