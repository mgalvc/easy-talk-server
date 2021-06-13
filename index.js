const http = require('http')
const app = require('express')()
const cors = require('cors')
const { v4: uuidv4 } = require('uuid')

app.use(cors())

app.post('/room', (req, res) => {
  const code = uuidv4()
  res.send({ code })
})

http.createServer(app).listen(8181, () => {
  console.log('server listening on 8181')
})
