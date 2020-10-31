const algorithmia = require('algorithmia')
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd')

const watsonApiKey = require('../credentials/watson-nlu.json').apikey
const watsonURL = require('../credentials/watson-nlu.json').url

const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1')
const { IamAuthenticator } = require('ibm-watson/auth')

const nlu = new NaturalLanguageUnderstandingV1({
  version: '2020-08-01',
  authenticator: new IamAuthenticator({
    apikey: watsonApiKey,
  }),
  serviceUrl: watsonURL
});

const state = require('./state.js')

async function robot() {
    const content = state.load();

    await buscarConteudoWikipedia(content)
    refinarConteudo(content)
    dividirConteudoEmSentencas(content)
    limitarMaximoSentencas(content)
    await buscarPalavrasChavesSentencas(content)

    state.save(content);

    async function buscarConteudoWikipedia(content) {
        const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey)
        const wikipediaAlgorithm = algorithmiaAuthenticated.algo("web/WikipediaParser/0.1.2?timeout=60") 
        const wikipediaResponse = await wikipediaAlgorithm.pipe(content.searchTerm)
        const wikipediaContent = wikipediaResponse.get()
        
        content.sourceContentOriginal = wikipediaContent.content
    }

    function refinarConteudo (content){
        const withoutBlankLines = removerLinhasBranco(content.sourceContentOriginal)
        const withoutMarkdown = removerMarcadores(withoutBlankLines)
        const withoutDatesInParentheses = removerDatasEntreParenteses(withoutMarkdown)

        content.sourceContentSanitized = withoutDatesInParentheses

        function removerLinhasBranco(text) {
            const allLines = text.split('\n')

            const withoutBlankLines = allLines.filter((line) => {
                if (line.trim().length === 0) {
                    return false
                }
                return true
            })
            return withoutBlankLines    
        }

        function removerMarcadores(text) {
            const withoutMarkdown = text.filter((line)=> {
                if(line.trim().startsWith('=')) {
                    return false
                }
                return true
            })
            return withoutMarkdown
        }

        function removerDatasEntreParenteses(text) {
            return text.toString().replace(/(\s\(.*?\))|<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi,'').replace(/  /g,' ')
        }        
    }

    function dividirConteudoEmSentencas(content) {
        content.sentences = []
        const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)

        sentences.forEach((sentence) => {
            content.sentences.push({
                text: sentence,
                keywords: [],
                images: []
            })
        })
    }

    function limitarMaximoSentencas(content) {
        content.sentences = content.sentences.slice(0, content.maximumSentences)
    }

    async function buscarPalavrasChavesSentencas(content) {
        for (const sentence of content.sentences) {
            sentence.keywords = await buscarInterpretacaoWatsonKeywords(sentence.text)
        }
    }

    async function buscarInterpretacaoWatsonKeywords(sentence) {
        return new Promise((resolve, reject) => {
            nlu.analyze ({
                text: sentence,
                features: {
                    keywords: {}
                }
            }, 
            (error, response) => {
                if(error) {
                    reject(error)
                    return
                }

                const keywords = response.result.keywords.map((keyword) => {
                    return keyword.text
                  })
                  
                resolve(keywords)
            })
        })
    }
}

module.exports = robot