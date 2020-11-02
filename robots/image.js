const imageDownloader = require('image-downloader')
const gm = require('gm').subClass({ imageMagick: true })

const google = require('googleapis').google
const customSearch = google.customsearch('v1')
const state = require('./state.js')

const googleSearchCredentials = require('../credentials/google-search.json')

const path = require('path')
const rootPath = path.resolve(__dirname, '..')
const fromRoot = relPath => path.resolve(rootPath, relPath)

async function robot() {
    const content = state.load()

    await buscarImagensDasSentencas(content)
    await baixarTodasImagens(content)
    await converterTodasImagens(content)
    await criarSentencasTodasImagens(content)
    await criarYouTubeThumbnail()

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

    async function converterTodasImagens(content) {
        for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
            await converterImagem(sentenceIndex)
            //.then(result => console.log("Promise resolved: " + result))
            //.catch(error => console.log("Promises rejected: " + error));
        }
    }

    async function converterImagem(sentenceIndex) {
        return new Promise((resolve, reject) => {
            const inputFile = fromRoot(`./content/${sentenceIndex}-original.png[0]`)
            const outputFile = fromRoot(`./content/${sentenceIndex}-converted.png`)
            const width = 1920
            const height = 1080

            gm()
                .in(inputFile)
                .out('(')
                .out('-clone')
                .out('0')
                .out('-background', 'white')
                .out('-blur', '0x9')
                .out('-resize', `${width}x${height}^`)
                .out(')')
                .out('(')
                .out('-clone')
                .out('0')
                .out('-background', 'white')
                .out('-resize', `${width}x${height}`)
                .out(')')
                .out('-delete', '0')
                .out('-gravity', 'center')
                .out('-compose', 'over')
                .out('-composite')
                .out('-extent', `${width}x${height}`)
                .write(outputFile, (error) => {
                    if (error) {
                        return reject(error)
                    }
                    console.log(`> [video-robot] Imagem convertida: ${outputFile}`)
                    resolve()
                })
        })
    }

    async function criarSentencasTodasImagens(content) {
        for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
            await criarSentencasImagem(sentenceIndex, content.sentences[sentenceIndex].text)            
        }
    }

    async function criarSentencasImagem(sentenceIndex, sentenceText) {
        return new Promise((resolve, reject) => {
            const outputFile = `./content/${sentenceIndex}-sentence.png`

            const templateSettings = {
                0: {
                    size: '1920x400',
                    gravity: 'center'
                },
                1: {
                    size: '1920x400',
                    gravity: 'center'
                },
                2: {
                    size: '800x1080',
                    gravity: 'west'
                },
                3: {
                    size: '1920x400',
                    gravity: 'center'
                },
                4: {
                    size: '1920x1080',
                    gravity: 'center'
                },
                5: {
                    size: '80x1080',
                    gravity: 'west'
                },
                6: {
                    size: '1920x400',
                    gravity: 'center'
                }
            }

            gm()
            .out('-size', templateSettings[sentenceIndex].size)
            .out('-gravity', templateSettings[sentenceIndex].gravity)
            .out('-background','transparent')
            .out('-fill','white')
            .out('-kerning','-1')
            .out(`caption:${sentenceText}`)
            .write(outputFile, (error) => {
                if(error) {
                    return reject(error)
                }
                console.log(`> Sentença criada: ${outputFile}`)
                resolve()
            })
        })
    }

    async function criarYouTubeThumbnail() {
        return new Promise((resolve, reject) => {
          gm()
            .in(fromRoot('./content/0-converted.png'))
            .write(fromRoot('./content/youtube-thumbnail.jpg'), (error) => {
              if (error) {
                return reject(error)
              }
    
              console.log('> [video-robot] YouTube thumbnail created')
              resolve()
            })
        })
      }
}

module.exports = robot