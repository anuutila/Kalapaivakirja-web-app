const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const Entry = require('./models/entry')
const { validateEntryInput } = require('./utils/validation')
const { default: mongoose } = require('mongoose')
const getMONDODB_URI = require('./utils/database')
const User = require('./models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

console.log('connecting to', getMONDODB_URI())

mongoose.connect(getMONDODB_URI())
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', error.message)
  })



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

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  } else if (error.name ===  'JsonWebTokenError') {
    return response.status(400).json({ error: 'token missing or invalid' })
  } else if (error.name === 'TokenExpiredError') {
    return response.status(401).json({ error: 'token expired' })
  }

  next(error)
}


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
  const userPrivilege = Number(request.query.userPrivilege);
  if (userPrivilege === 3) {
    return response.status(401).json({ error: 'user must be logged in to delete entries' })
  }
  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })
  }
  if (userPrivilege !== 1) {
    return response.status(401).json({ error: 'user does not have permission to delete entries' })
  }

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
      // console.error(`failed to delete entry with id ${id}, ${error}`)
      // response.status(400).send({ error: `failed to delete entry with id ${id}, ${error}` })
      next(error)
    })
})

app.post('/api/entries', (request, response) => {
  const body = request.body
  if (!body.user) {
    return response.status(401).json({ error: 'user must be logged in to create new entries' })
  }
  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })
  }
  if (body.user.privilege !== 1) {
    return response.status(401).json({ error: 'user does not have permission to create new entries' })
  }

  const entryObject = body.entryObject
  // Validate the user inputted values
  const validationError = validateEntryInput(entryObject);
  if (validationError) {
    console.error(validationError)
    return response.status(400).json({error: validationError})
  }

  const entry = new Entry({
    fish: entryObject.fish.trim().toLowerCase(),
    date: entryObject.date,
    length: entryObject.length || "-",
    weight: entryObject.weight || "-",
    lure: entryObject.lure.trim() || "-",
    place: entryObject.place.trim() || "-",
    coordinates: entryObject.coordinates.trim() || "-",
    time: entryObject.time,
    person: (entryObject.person.charAt(0).toUpperCase() + entryObject.person.slice(1).toLowerCase()).trim()
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

app.put('/api/entries/:id', (request, response, next) => {
  const body = request.body
  const userPrivilege = Number(request.query.userPrivilege);
  if (userPrivilege === 3) {
    return response.status(401).json({ error: 'user must be logged in to edit entries' })
  }
  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })
  }
  if (userPrivilege !== 1) {
    return response.status(401).json({ error: 'user does not have permission to edit entries' })
  }

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
      next(error)
    })

})  

app.post('/api/users', async (request, response, next) => {
  const body = request.body

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(body.password, saltRounds)

  const user = new User({
    username: body.username.trim(),
    email: body.email.trim(),
    passwordHash: passwordHash,
    privilege: body.privilege
  })

  user
    .save()
    .then(savedUser => {
      response.json(savedUser)
    })
    .catch(error => {
      console.error(error)
      next(error)
    })
})

app.get('/api/users', (request, response) => {
  User
    .find({})
    .then(users => {
      response.json(users)
    })
    .catch(error => {
      console.error(error)
      response.status(500).json({ error: `failed to retrieve users, ${error}`})
    })
})

app.post('/api/login', async (request, response) => {
  const { username, password } = request.body

  const user = await User.findOne({ username })
  const passwordCorrect = user === null
    ? false
    : await bcrypt.compare(password, user.passwordHash)

  if (!(user && passwordCorrect)) {
    return response.status(401).json({
      error: 'invalid username or password'
    })
  }

  const userForToken = {
    username: user.username,
    id: user.id,
  }

  // token expires in 2 629 743 seconds, that is, in one month
  const token = jwt.sign(
    userForToken, 
    process.env.SECRET,
    { expiresIn: 2629743 }
  )

  response
    .status(200)
    .send({ token, username: user.username, privilege: user.privilege })
})

const getTokenFrom = (request) => {
  const authorization = request.get('authorization')
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.replace('Bearer ', '')
  }
  return null
}


const unknownEndpoint = (request, response) => {
  response.status(404).send({error: 'unknown endpoint'})
}

app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
