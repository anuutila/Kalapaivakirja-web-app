const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')

app.use(bodyParser.json())
app.use(cors())

const logger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}

app.use(logger)

let entries = [
  {
    id: 1,
    fish: "kuha",
    date: "5.5.2022",
    length: 44,
    weigh: 0.7,
    lure: "mikado saira",
    place: "palosaaren kivikko",
    time: "16.30",
    person: "Akseli"
  },
  {
    id: 2,
    fish: "ahven",
    date: "7.6.",
    length: "-",
    weight: 0.3,
    lure: "huntershad",
    place: "kotasaari",
    time: "20.00",
    person: "Elmeri"
  },
  {
    id: 3,
    fish: "hauki",
    date: "20.7.",
    lengt: 65,
    weight: 2.0,
    lure: "jesse-vaappu",
    place: "ruuhiniemi",
    time: "13.00",
    person: "Akseli"
  }
]

app.get('/', (req, res) => {
  res.send('<h1>Hello World!</h1>')
})

app.get('/entries', (req, res) => {
  res.json(entries)
})

app.get('/entries/:id', (request, response) => {
  const id = Number(request.params.id)
  const entry = entries.find(entry => entry.id === id)

  if ( entry ) {
    response.json(entry)
  } else {
    response.status(404).end()
  }
})

app.delete('/entries/:id', (request, response) => {
  const id = Number(request.params.id)
  entries = entries.filter(entry => entry.id !== id)

  response.status(204).end()
})

app.post('/entries', (request, response) => {
  const body = request.body
  
  if (!body.fish || !body.date || !body.person) {
    return response.status(400).json({error: 'kalalaji, päivämäärä tai saajan nimi puuttuu'})
  }

  const entry = {
    id: 5,
    fish: body.fish,
    date: body.date,
    length: body.lengt || "-",
    weigh: body.weigh || "-",
    lure: body.lure || "-",
    place: body.place || "-",
    time: body.time || "-",
    person: body.person
  }

  entries = entries.concat(entry)

  response.json(entry)
})

const error = (request, response) => {
  response.status(404).send({error: 'unknown endpoint'})
}

app.use(error)

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
