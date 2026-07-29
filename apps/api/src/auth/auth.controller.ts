import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioStatusDto } from './dto/update-usuario-status.dto';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserRole } from '@gestion-pas/types';
import { Usuario } from '../database/entities/usuario.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión y obtener JWT' })
  @ApiResponse({ status: 200, description: 'Login exitoso — devuelve accessToken + perfil' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas o usuario inactivo' })
  @ApiResponse({ status: 400, description: 'Body inválido (email mal formado, campos faltantes)' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ORGANIZADOR)
  @Post('users')
  @ApiOperation({ summary: 'Crear usuario (solo organizador)' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({ status: 400, description: 'DTO inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo el organizador puede crear usuarios' })
  @ApiResponse({ status: 404, description: 'entidadId no encontrada' })
  @ApiResponse({ status: 409, description: 'El identificadorAcceso ya está en uso' })
  createUsuario(
    @Body() dto: CreateUsuarioDto,
    @CurrentUser() currentUser: Usuario,
  ) {
    return this.authService.createUsuario(dto, currentUser);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ORGANIZADOR)
  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Activar o desactivar un usuario (solo organizador)' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 400, description: 'UUID o DTO inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo el organizador puede modificar estados' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUsuarioStatusDto,
    @CurrentUser() currentUser: Usuario,
  ) {
    return this.authService.updateStatus(id, dto.estado, currentUser);
  }
}
