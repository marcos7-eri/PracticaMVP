import { Controller, Get, Post, Body, Param, HttpCode, Inject } from '@nestjs/common';
import { ParkingService } from './parking.service.js';
@Controller('api')
export class ParkingController {
  constructor(@Inject(ParkingService) private readonly parking:ParkingService){}
  @Get('health') health(){return{status:'ok'};}
  @Get('spots') spots(){return this.parking.spots();}
  @Get('summary') summary(){return this.parking.summary();}
  @Get('stays') stays(){return this.parking.stays();}
  @Post('spots') addSpot(@Body() body:{code?:string}){return this.parking.addSpot(body);}
  @Post('stays') enter(@Body() body:{plate?:string;spot?:string}){return this.parking.enter(body);}
  @Post('stays/:id/exit') @HttpCode(200) exit(@Param('id') id:string){return this.parking.exit(Number(id));}
}
