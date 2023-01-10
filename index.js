// IMPORTS
const express = require('express');
const { Client } = require('pg');
require('dotenv').config()

// DECLARATIONS
const app = express();
const port = 8000;
const client = new Client({
    user: process.env.DB_USERNAME,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME, 
    password: process.env.DB_PASSWORD,
    port: 5432,
});
client.connect();
app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware
    next();
});
app.use(express.json())

// ROUTES
app.get('/api/tickets', async (req, res) => {
    try {
        const data = await client.query('SELECT * FROM tickets');
        res.status(200).json({
            status: "SUCCESS",
            message: "Ticket get !",
            data: data.rows
        });
    }
    catch (err) {
        console.log(err.stack)
        res.status(400).json({
            status: "FAIL",
            message: "Erreur de syntaxe",
            data: null
        })
    }
})
app.get('/api/tickets/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
        const newData = await client.query('SELECT * FROM tickets where id = $1', [id]);
        if (newData.rowCount > 0) {
            res.status(200).json({
                status: "SUCCESS",
                message: `Ticket ${id}`,
                data: newData.rows[0]
            });
        }
        else {
            res.status(404).json({
                status: "FAIL",
                message: "Aucun ticket trouvé - Vérifier le numéro du ticket",
                data: null
            });
        }
    }
    catch (err) {
        console.log(err.stack)
        res.status(400).json({
            status: "FAIL",
            message: "Le type de donnée pour 'id' n'est pas valide - Type attendu 'Number'",
            data: null
        })
    }
})
app.post('/api/post', async (req, res) => {
    const message = req.body.message;
    const user_id = req.body.user_id;
    try {
        const data = await client.query('INSERT INTO tickets (message, user_id) VALUES ($1, $2) RETURNING *', [message, user_id])
        if ((message && user_id) && (data.rowCount > 0)) {
            console.log('201')
            res.status(201).json({
                status: "SUCCESS",
                message: "Ticket Posted !",
                data: data.rows
            })
        }
        else {
            console.log('Try/Else')
            res.status(400).json({
                status: 'FAIL',
                message: "Contenu du message vide - Exemple ''",
                data: null
            })
        }
    }
    catch (err) {
        console.log(err.stack)
        if (!(user_id)) {
            res.status(400).json
                ({
                    status: 'FAIL',
                    message: "Champ User_ID manquant ou vide",
                    data: null
                })
        }
        else if (!message) {
            res.status(400).json({
                status: 'FAIL',
                message: 'Message manquant',
                data: null
            })
        }
        else if ((typeof (message) === undefined)) {
            res.status(404).json({
                status: 'FAIL',
                message: "Type de donnée de 'Message' incorrect - Type attendu 'String'",
                data: null
            })
        }
        else if (!(typeof (user_id) === 'number')) {
            res.status(404).json({
                status: 'FAIL',
                message: "Type de donnée de 'User_ID' incorrect - Type attendu 'Number'",
                data: null
            })
        }
        else {
            res.status(400).json
                ({
                    status: 'FAIL',
                    message: "User_id inconnu - Philippe tu ne peux pas poster de message :D",
                    data: null
                })
        }
    }
})
app.put('/api/update', async (req, res) => {
    const id = req.body.id;
    const message = req.body.message;
    const done = req.body.done;
    if (typeof(message) === 'boolean') {
        res.status(400).json({
            status: "FAIL",
            message: "Type de donnée pour 'Message' incorrect - Type attendu 'String' ou 'Number'",
            data: null
        })
    }
    else if (typeof(done) !== 'boolean') {
        res.status(400).json({
            status: "FAIL",
            message: "Type de donnée pour 'Done' incorrect - Type attendu 'Boolean'",
            data: null
        })
    }
    else if (!(id && message && done !== undefined)) {
        res.status(400).json({
            status: "FAIL",
            message: "3 données attendues",
            data: null
        })
    }
    else if (!(typeof(id) === 'number')) {
        res.status(400).json({
            status: "FAIL",
            message: "Type de donnée pour 'id' incorrect - Type attendu 'Number'",
            data: null
        })
    }
    else {
        try {
            const data = await client.query('SELECT id FROM tickets WHERE id =$1', [id])
            const newData = await client.query('UPDATE tickets SET message = $2, done = $3 WHERE id =$1 RETURNING *', [id, message, done]);
            if (data.rowCount > 0) {
                res.status(200).json({
                    status: "SUCCESS",
                    message: "Ticket Updated !",
                    data: newData.rows
                })
            }
            else {
                res.status(404).json({
                    status: "FAIL",
                    message: "Ticket id inconnu'",
                    data: null
                })
            }
        }
        catch (err){
            console.log(err.stack);
        }
    }
})
app.delete('/api/delete/:id', async (req, res) => {
    try {
        const id = Number(req.params.id)
        console.log(id)
        console.log(typeof(id));
        const data = await client.query('DELETE FROM tickets WHERE id = $1 RETURNING *', [id])
        const newData = await client.query('SELECT * FROM tickets')
        if (!id) {
            res.status(400).json({
                status: 'FAIL',
                message: "id manquant",
                data: null
            })
        }
        else if (data.rowCount === 1) {
            res.status(200).json({
                status: "SUCCESS",
                message: 'Ticket deleted !',
                data: newData.rows
            })
        }
        else if (!(typeof (id) === 'number')) {
            res.status(400).json({
                status: 'FAIL',
                message: "Le type de donnée attendu pour 'id' n'est pas conforme - Type attendu 'Number'",
                data: null
            })
        }
        else {
            res.status(404).json({
                status: 'FAIL',
                message: "Ticket ID inconnu - Vérifier le numéro du ticket",
                data: null
            })
        }
    }
    catch (err) {
        console.log(err.stack);
        res.status(400).json({
            status: 'FAIL',
            message: "Le type de donnée attendu est 'Number'",
            data: null
        })
    }
});
app.all('*', function (req, res) {
    res.status(404).json({
        status: 'FAIL',
        data: null,
        error: "L'adresse saisie n'existe pas"
    });
});

// ECOUTE LE PORT 8000 (ligne 6)
app.listen(port, () => {
    console.log(`Example app listening on port http://localhost:${port}`)
})