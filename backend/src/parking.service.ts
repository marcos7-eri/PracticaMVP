import { Injectable, HttpException, HttpStatus, OnModuleDestroy } from '@nestjs/common';
import { createDb } from './db.js';
import { normalizePlate, validPlate, validSpot, fee, occupancy } from './domain.js';
import type { DatabaseSync } from 'node:sqlite';

@Injectable()
export class ParkingService implements OnModuleDestroy {
  private db: DatabaseSync;
  constructor() { this.db=createDb(process.env.DB_FILE || './data/parking.sqlite'); }
  onModuleDestroy(){this.db.close();}
  spots(){return this.db.prepare(`SELECT s.code, CASE WHEN t.id IS NULL THEN 0 ELSE 1 END AS occupied, t.plate FROM spots s LEFT JOIN stays t ON t.spot_id=s.id AND t.exited_at IS NULL ORDER BY s.code`).all();}
  summary(){const total=Number((this.db.prepare('SELECT COUNT(*) AS n FROM spots').get() as any).n);const occupied=Number((this.db.prepare('SELECT COUNT(*) AS n FROM stays WHERE exited_at IS NULL').get() as any).n);return{total,occupied,available:total-occupied,occupancy:occupancy(occupied,total)};}
  stays(){return this.db.prepare(`SELECT t.id,t.plate,s.code AS spot,t.entered_at,t.exited_at,t.fee FROM stays t JOIN spots s ON s.id=t.spot_id ORDER BY t.id DESC`).all();}
  addSpot(body:{code?:string}){const code=String(body?.code??'').trim().toUpperCase();if(!validSpot(code))throw new HttpException('Código de plaza inválido',400);try{this.db.prepare('INSERT INTO spots (code) VALUES (?)').run(code);return{code};}catch{throw new HttpException('La plaza ya existe',409);}}
  enter(body:{plate?:string;spot?:string}){const plate=normalizePlate(body?.plate),code=String(body?.spot??'').trim().toUpperCase();if(!validPlate(plate))throw new HttpException('Placa inválida',400);const spot=this.db.prepare('SELECT id FROM spots WHERE code=?').get(code) as any;if(!spot)throw new HttpException('Plaza inexistente',404);if(this.db.prepare('SELECT id FROM stays WHERE plate=? AND exited_at IS NULL').get(plate))throw new HttpException('Vehículo ya registrado',409);if(this.db.prepare('SELECT id FROM stays WHERE spot_id=? AND exited_at IS NULL').get(spot.id))throw new HttpException('Plaza ocupada',409);const entered_at=new Date().toISOString();const result=this.db.prepare('INSERT INTO stays (plate,spot_id,entered_at) VALUES (?,?,?)').run(plate,spot.id,entered_at);return{id:Number(result.lastInsertRowid),plate,spot:code,entered_at};}
  exit(id:number){const stay=this.db.prepare('SELECT * FROM stays WHERE id=?').get(id) as any;if(!stay)throw new HttpException('Estadía inexistente',404);if(stay.exited_at)throw new HttpException('Salida ya registrada',409);const exited_at=new Date().toISOString(),amount=fee(stay.entered_at,exited_at);this.db.prepare('UPDATE stays SET exited_at=?,fee=? WHERE id=?').run(exited_at,amount,id);return{id,exited_at,fee:amount};}
}
