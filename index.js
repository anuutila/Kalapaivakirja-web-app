const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const Entry = require('./models/entry')
const { validateEntryInput } = require('./utils/validation')
const { default: mongoose } = require('mongoose')

app.use(express.static('build'))
app.use(bodyParser.json())
app.use(cors())

// app.use(express.static('build', {
//   etag: true,
//   lastModified: true,
//   setHeaders: (res, path) => {
//     const hashRegExp = /\.[0-9a-f]{8,20}\./

//     if (path.endsWith('.html')) {
//       res.setHeader('Cache-Control', 'no-cache');
//     } else if (hashRegExp.test(path) || /favicon/.test(path)) {
//       res.setHeader('Cache-Control', 'public, max-age=31536001');
//       console.log('Cached')
//     }
//   },
// }));

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
      console.error(error)
      response.status(500).json({ error: `failed to retrieve entries, ${error}`})
    })
})

app.get('/api/entries/:id', (request, response) => {
  const id = request.params.id
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return response.status(400).json({ error: 'invalid id' })
  }
  Entry
    .findById(id)
    .then(entry => {
      if (entry) {
        response.json(formatEntry(entry))
      } else {
        response.status(404).json({ error: 'entry not found' })
      }
    })
    .catch(error => {
      console.error(error)
      response.status(500).json({ error: `failed to retrieve entry, ${error}` })
    })
})

app.delete('/api/entries/:id', (request, response) => {
  const id = request.params.id
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return response.status(400).json({ error: 'invalid id' })
  }
  Entry
    .findByIdAndRemove(id)
    .then(entry => {
      if (!entry) {
        return response.status(404).json({ error: 'entry not found' })
      }
      response.status(204).end()
    })
    .catch(error => {
      console.error(`failed to delete entry with id ${id}, ${error}`)
      response.status(400).send({ error: `failed to delete entry with id ${id}, ${error}` })
    })
})

app.post('/api/entries', (request, response) => {
  const body = request.body

  // Validate the user inputted values
  const validationError = validateEntryInput(body);
  if (validationError) {
    console.error(validationError)
    return response.status(400).json({error: validationError})
  }

  const entry = new Entry({
    fish: body.fish.trim().toLowerCase(),
    date: body.date,
    length: body.length || "-",
    weight: body.weight || "-",
    lure: body.lure.trim() || "-",
    place: body.place.trim() || "-",
    coordinates: body.coordinates.trim() || "-",
    time: body.time,
    person: (body.person.charAt(0).toUpperCase() + body.person.slice(1).toLowerCase()).trim()
  })

  entry
    .save()
    .then(formatEntry)
    .then(savedAndFormattedEntry => {
      response.json(savedAndFormattedEntry)
    })
    .catch(error => {
      console.error(error)
    })
})

app.put('/api/entries/:id', (request, response) => {
  const body = request.body

  // Validate the user inputted values
  const validationError = validateEntryInput(body);
  if (validationError) {
    console.error(validationError)
    return response.status(400).json({error: validationError})
  }

  const entry = {
    fish: body.fish.trim(),
    date: body.date,
    length: body.length || "-",
    weight: body.weight || "-",
    lure: body.lure.trim() || "-",
    place: body.place.trim() || "-",
    coordinates: body.coordinates.trim() || "-",
    time: body.time || "-",
    person: body.person.trim()
  }

  Entry
    .findByIdAndUpdate(request.params.id, entry, { new: true })
    .then(updatedEntry => {
      response.json(formatEntry(updatedEntry))
    })
    .catch(error => {
      console.error(error)
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
