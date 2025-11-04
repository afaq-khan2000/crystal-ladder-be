import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ChildrenService } from './children.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';
import { JwtAuthGuard } from '../auth/guards/local-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enums/roles.enum';
import { ApiSecurityAuth } from '@/common/decorators/swagger.decorator';

@Controller('children')
@ApiTags('children')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiSecurityAuth()
@ApiBearerAuth()
export class ChildrenController {
  constructor(private readonly childrenService: ChildrenService) {}

  /**
   * Create a new child record
   * Parents can create children linked to their account
   */
  @Post()
  @Roles(Role.Parent, Role.Admin)
  @ApiOperation({ summary: 'Create a new child record' })
  @ApiResponse({ status: 201, description: 'Child created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() createChildDto: CreateChildDto, @Request() req) {
    return this.childrenService.create(createChildDto, req.user.id);
  }

  /**
   * Get all children
   * Admin and therapists can see all children
   * Parents can only see their own children
   */
  @Get()
  @ApiOperation({ summary: 'Get all children (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'List of children' })
  async findAll(@Query('page') page: string, @Query('limit') limit: string, @Request() req) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    if (req.user.role === Role.Parent) {
      return this.childrenService.findAllByParent(req.user.id, pageNum, limitNum);
    } else if (req.user.role === Role.Therapist) {
      return this.childrenService.findByTherapist(req.user.id, pageNum, limitNum);
    } else {
      return this.childrenService.findAll(pageNum, limitNum);
    }
  }

  /**
   * Get a specific child by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a child by ID' })
  @ApiResponse({ status: 200, description: 'Child details' })
  @ApiResponse({ status: 404, description: 'Child not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.childrenService.findOne(
      parseInt(id),
      req.user.id,
      req.user.role,
    );
  }

  /**
   * Update a child record
   */
  @Patch(':id')
  @Roles(Role.Parent, Role.Admin, Role.Therapist)
  @ApiOperation({ summary: 'Update a child record' })
  @ApiResponse({ status: 200, description: 'Child updated successfully' })
  @ApiResponse({ status: 404, description: 'Child not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Param('id') id: string,
    @Body() updateChildDto: UpdateChildDto,
    @Request() req,
  ) {
    return this.childrenService.update(
      parseInt(id),
      updateChildDto,
      req.user.id,
      req.user.role,
    );
  }

  /**
   * Delete a child record (soft delete)
   */
  @Delete(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete a child record' })
  @ApiResponse({ status: 200, description: 'Child deleted successfully' })
  @ApiResponse({ status: 404, description: 'Child not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string, @Request() req) {
    return this.childrenService.remove(
      parseInt(id),
      req.user.id,
      req.user.role,
    );
  }
}

