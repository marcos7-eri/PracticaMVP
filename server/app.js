import express from 'express';
import { normalizePlate, validPlate, validSpot, fee, occupancy } from './domain.js';
import { createDb } from './db.js';
export function createApp(db=createDb()) {
  const app=express(); app.use(express.json());
  app.get('/api/health',(_req,res)=>res.json({status:'ok'}));
  app.get('/api/spots',(_req,res)=>res.json(db.prepare(`SELECT s.code, CASE WHEN t.id IS NULL THEN 0 ELSE 1 END AS occupied, t.plate FROM spots s LEFT JOIN stays t ON t.spot_id=s.id AND t.exited_at IS NULL ORDER BY s.code`).all()));
  app.get('/api/summary',(_req,res)=>{const total=db.prepare('SELECT COUNT(*) AS n FROM spots').get().n;const occupied=db.prepare('SELECT COUNT(*) AS n FROM stays WHERE exited_at IS NULL').get().n;res.json({total,occupied,available:total-occupied,occupancy:occupancy(occupied,total)});});
  app.get('/api/stays',(_req,res)=>res.json(db.prepare(`SELECT t.id,t.plate,s.code AS spot,t.entered_at,t.exited_at,t.fee FROM stays t JOIN spots s ON s.id=t.spot_id ORDER BY t.id DESC`).all()));
  app.post('/api/spots',(req,res)=>{const code=String(req.body.code??'').trim().toUpperCase();if(!validSpot(code))return res.status(400).json({error:'Código de plaza inválido'});try{db.prepare('INSERT INTO spots (code) VALUES (?)').run(code);res.status(201).json({code});}catch{res.status(409).json({error:'La plaza ya existe'});}});
  app.post('/api/stays',(req,res)=>{const plate=normalizePlate(req.body.plate),code=String(req.body.spot??'').trim().toUpperCase();if(!validPlate(plate))return res.status(400).json({error:'Placa inválida'});const spot=db.prepare('SELECT id FROM spots WHERE code=?').get(code);if(!spot)return res.status(404).json({error:'Plaza inexistente'});if(db.prepare('SELECT id FROM stays WHERE plate=? AND exited_at IS NULL').get(plate))return res.status(409).json({error:'Vehículo ya registrado'});if(db.prepare('SELECT id FROM stays WHERE spot_id=? AND exited_at IS NULL').get(spot.id))return res.status(409).json({error:'Plaza ocupada'});const entered_at=new Date().toISOString();const result=db.prepare('INSERT INTO stays (plate,spot_id,entered_at) VALUES (?,?,?)').run(plate,spot.id,entered_at);res.status(201).json({id:Number(result.lastInsertRowid),plate,spot:code,entered_at});});
  app.post('/api/stays/:id/exit',(req,res)=>{const stay=db.prepare('SELECT * FROM stays WHERE id=?').get(req.params.id);if(!stay)return res.status(404).json({error:'Estadía inexistente'});if(stay.exited_at)return res.status(409).json({error:'Salida ya registrada'});const exited_at=new Date().toISOString(),amount=fee(stay.entered_at,exited_at);db.prepare('UPDATE stays SET exited_at=?,fee=? WHERE id=?').run(exited_at,amount,stay.id);res.json({id:stay.id,exited_at,fee:amount});});
  app.use('/api',(req,res)=>res.status(404).json({error:'Ruta inexistente'}));
  return app;
}
