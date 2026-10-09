import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ImportService } from './import.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@gestion-pas/types';
import { Usuario } from '../database/entities/usuario.entity';

const fileBody = {
  schema: {
    type: 'object',
    properties: { file: { type: 'string', format: 'binary' } },
    required: ['file'],
  },
};

@ApiBearerAuth()
@ApiTags('import')
@Roles(UserRole.ORGANIZADOR)
@Controller('import')
export class ImportController {
  constructor(private readonly service: ImportService) {}

  @Post('companias')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody(fileBody)
  @ApiOperation({ summary: 'Importar compañías desde CSV' })
  @ApiResponse({ status: 200, description: '{ inserted, skipped, errors }' })
  importCompanias(@UploadedFile() file: Express.Multer.File) {
    return this.service.importCompanias(file.buffer);
  }

  @Post('productores')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody(fileBody)
  @ApiOperation({ summary: 'Importar productores desde CSV' })
  @ApiResponse({ status: 200, description: '{ inserted, skipped, errors }' })
  importProductores(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.service.importProductores(file.buffer, usuario);
  }

  @Post('asegurados')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody(fileBody)
  @ApiOperation({ summary: 'Importar asegurados desde CSV' })
  @ApiResponse({ status: 200, description: '{ inserted, skipped, errors }' })
  importAsegurados(@UploadedFile() file: Express.Multer.File) {
    return this.service.importAsegurados(file.buffer);
  }

  @Post('bienes')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody(fileBody)
  @ApiOperation({ summary: 'Importar bienes asegurados desde CSV' })
  @ApiResponse({ status: 200, description: '{ inserted, skipped, errors }' })
  importBienes(@UploadedFile() file: Express.Multer.File) {
    return this.service.importBienes(file.buffer);
  }

  @Post('polizas')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody(fileBody)
  @ApiOperation({ summary: 'Importar pólizas desde CSV' })
  @ApiResponse({ status: 200, description: '{ inserted, skipped, errors }' })
  importPolizas(@UploadedFile() file: Express.Multer.File) {
    return this.service.importPolizas(file.buffer);
  }

  @Post('endosos')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody(fileBody)
  @ApiOperation({ summary: 'Importar endosos desde CSV' })
  @ApiResponse({ status: 200, description: '{ inserted, skipped, errors }' })
  importEndosos(@UploadedFile() file: Express.Multer.File) {
    return this.service.importEndosos(file.buffer);
  }

  @Post('cuotas')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody(fileBody)
  @ApiOperation({ summary: 'Importar cuotas desde CSV' })
  @ApiResponse({ status: 200, description: '{ inserted, skipped, errors }' })
  importCuotas(@UploadedFile() file: Express.Multer.File) {
    return this.service.importCuotas(file.buffer);
  }

  @Post('siniestros')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody(fileBody)
  @ApiOperation({ summary: 'Importar siniestros desde CSV' })
  @ApiResponse({ status: 200, description: '{ inserted, skipped, errors }' })
  importSiniestros(@UploadedFile() file: Express.Multer.File) {
    return this.service.importSiniestros(file.buffer);
  }

  @Post('reclamos')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody(fileBody)
  @ApiOperation({ summary: 'Importar reclamos desde CSV' })
  @ApiResponse({ status: 200, description: '{ inserted, skipped, errors }' })
  importReclamos(@UploadedFile() file: Express.Multer.File) {
    return this.service.importReclamos(file.buffer);
  }
}
