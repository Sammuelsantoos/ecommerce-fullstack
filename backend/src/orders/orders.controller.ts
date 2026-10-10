import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../generated/prisma/enums.js';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Post()
  create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.orders.create(userId, dto);
  }

  @Get('me')
  findMine(@CurrentUser('userId') userId: string) {
    return this.orders.findAllByUser(userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.orders.findAll();
  }
}
