
const bodyParser = require("body-parser")
const express = require("express")
const cors = require("cors")
const bcrypt = require("bcrypt")
const { saveReminder, createUser, getUserInfo } = require("./db.js")
const jwt = require("jsonwebtoken")

const JWT_SECRET = process.env.JWT_SECRET
const EXPIRATION_TIME = process.env.EXPIRATION_TIME || 300
const app = express()
const port = process.env.PORT || 2000

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.listen(port, function() {
    console.log(`Listening on port ${port}`);
  });

function verifyJWTSecureRoute(req, res, next) {

  const accessedUser = req.params.name

  const token = req.headers['x-access-token']
 
  jwt.verify(token, JWT_SECRET, async (err, decoded) => { 
    if (err) {
      console.log(err)
      res.json({ error: "User is not logged in or provided an invalid token" }).end()
      return  
    }
    if (decoded.name != accessedUser) {
      res.json({ error: "User is logged in with another account" })
      return
    }       
    const { name } = decoded
    const newToken = jwt.sign({ name }, JWT_SECRET, { expiresIn: EXPIRATION_TIME })
    req.refreshToken = newToken
    next()
  })
}                


app.post('/api/users/:name', verifyJWTSecureRoute, (req, res) => {
  saveReminder({
    name: req.body.name,
    date: req.body.date,
    label: req.body.label
  }, data => res.json({ ...data, token: req.refreshToken }))
})


app.get('/api/users/:name/reminders', verifyJWTSecureRoute, async (req, res) => {
  const { appointments } = await getUserInfo({ name: req.params.name })
  res.json({ appointments, token: req.refreshToken  })
})



app.use('/api/newUser', async (req, res) => {
  const { name, password } = req.body
  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(password, salt)
  const user = { 
    name,
    hash
  }

  createUser(user, (err, data) => {
    if(err)
      res.json({ error: "Username already in use"})
    res.json(data)
  })
})


app.post("/api/login", async (req, res) => {
  const body = req.body
  const userInfo = await getUserInfo(body)

  console.log(body, userInfo)
  
  if(userInfo.error){
    res.status(401).json(userInfo)
  } else{

    const validPassword = await bcrypt.compare(body.password, userInfo.hash)
    
    if(validPassword){
      const { name } = userInfo
      const token = jwt.sign({ name }, JWT_SECRET, { expiresIn: EXPIRATION_TIME })
      res.json({ token })
    } else{
      res.json({ error: "Invalid password" })
    }
  }
})
