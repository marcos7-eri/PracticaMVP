import fs from 'node:fs';import path from 'node:path';import express from 'express';import {createApp} from './app.js';import {createDb} from './db.js';
const file=process.env.DB_FILE||'./data/parking.sqlite';fs.mkdirSync(path.dirname(file),{recursive:true});
const app=createApp(createDb(file));app.use(express.static('dist'));app.get('/{*path}',(_req,res)=>res.sendFile(path.resolve('dist/index.html')));
app.listen(Number(process.env.PORT||3001),'0.0.0.0',()=>console.log('Parqueo Fácil en puerto '+(process.env.PORT||3001)));
