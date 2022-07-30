const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const Entry = require('./models/entry')

app.use(express.static('build'))
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

const formatEntry = (entry) => {
  return {
    id: entry._id,
    fish: entry.fish,
    date: entry.date,
    length: entry.length,
    weight: entry.weight,
    lure: entry.lure,
    place: entry.place,
    coordinates: entry.coordinates,
    time: entry.time,
    person: entry.person
  }
}

app.get('/api/entries', (request, response) => {
  Entry
    .find({}, {__v: 0})
    .then(entries => {
      response.json(entries.map(formatEntry))
    })
    .catch(error => {
      console.log(error)
    })
})

app.get('/api/entries/:id', (request, response) => {
  Entry
    .findById(request.params.id)
    .then(entry => {
      if (entry) {
        response.json(formatEntry(entry))
      } else {
        response.status(404).end()
      }
    })
    .catch(error => {
      console.log(error)
      response.status(400).send({ error: 'malformatted id' })
    })
})

app.delete('/api/entries/:id', (request, response) => {
  Entry
    .findByIdAndRemove(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => {
      console.log(error)
      response.status(400).send({ error: 'malformatted id' })
    })
})

app.post('/api/entries', (request, response) => {
  const body = request.body
  
  if (!body.fish || !body.date || !body.person) {
    return response.status(400).json({error: 'kalalaji, päivämäärä tai saajan nimi puuttuu'})
  }

  const entry = new Entry({
    fish: body.fish,
    date: body.date,
    length: body.length || "-",
    weight: body.weight || "-",
    lure: body.lure || "-",
    place: body.place || "-",
    coordinates: body.coordinates || "-",
    time: body.time || "-",
    person: body.person
  })

  entry
    .save()
    .then(formatEntry)
    .then(savedAndFormattedEntry => {
      response.json(savedAndFormattedEntry)
    })
    .catch(error => {
      console.log(error)
    })
})

app.put('/api/entries/:id', (request, response) => {
  const body = request.body

  const regex = /^\-?[0-9]+\.[0-9]{2,},\s[0-9]+\.[0-9]{2,}$|^$/

  if (!regex.test(body.coordinates)) {
    return response.status(400).json({error: 'Koordinaattien formaatti virheellinen\nOikea muoto: "xx.xxxxxxx, yy.yyyyyyy" tai tyhjä\n(huomaa välilyönti)'})
  }

  const entry = {
    fish: body.fish,
    date: body.date,
    length: body.length || "-",
    weight: body.weight || "-",
    lure: body.lure || "-",
    place: body.place || "-",
    coordinates: body.coordinates || "-",
    time: body.time || "-",
    person: body.person
  }

  Entry
    .findByIdAndUpdate(request.params.id, entry, { new: true })
    .then(updatedEntry => {
      response.json(formatEntry(updatedEntry))
    })
    .catch(error => {
      console.log(error)
    })

})  

const error = (request, response) => {
  response.status(404).send({error: 'unknown endpoint'})
}

app.use(error)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
