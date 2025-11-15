import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '@/entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Helper } from '@/utils';
import { Express } from 'express';
import { unlink } from 'fs/promises';
import { getEventImagePublicPath, resolvePublicPathToAbsolute } from '@/common/config/upload.config';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
  ) {}

  /**
   * Create a new event
   * @param createEventDto - Event data
   * @returns Created event
   */
  async create(
    createEventDto: CreateEventDto,
    imageFiles: Express.Multer.File[] = [],
  ): Promise<Event> {
    const uploadedImages = this.mapUploadedFiles(imageFiles);
    const event = this.eventRepository.create({
      ...createEventDto,
      images: [...(createEventDto.images ?? []), ...uploadedImages],
      isPublished: createEventDto.isPublished !== undefined ? createEventDto.isPublished : true,
      isFeatured: createEventDto.isFeatured || false,
    });

    return await this.eventRepository.save(event);
  }

  /**
   * Find all events (paginated)
   * @param page - Page number
   * @param limit - Items per page
   * @param isPublished - Filter by published status
   * @param isFeatured - Filter by featured status
   * @param type - Filter by event type
   * @returns Paginated list of events
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    isPublished?: boolean,
    isFeatured?: boolean,
    type?: string,
  ) {
    const where: any = {};

    if (isPublished !== undefined) {
      where.isPublished = isPublished;
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    if (type) {
      where.type = type;
    }

    const [events, total] = await this.eventRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { eventDate: 'ASC' },
    });

    return Helper.paginateResponse({ data: [events, total], page, limit });
  }

  /**
   * Find one event by ID
   * @param id - Event ID
   * @returns Event record
   */
  async findOne(id: number): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  /**
   * Update event record
   * @param id - Event ID
   * @param updateEventDto - Updated event data
   * @returns Updated event
   */
  async update(
    id: number,
    updateEventDto: UpdateEventDto,
    imageFiles: Express.Multer.File[] = [],
  ): Promise<Event> {
    const event = await this.findOne(id);
    const { existingImages, images: dtoImages, ...rest } = updateEventDto;
    const imagesToKeep =
      existingImages ?? dtoImages ?? event.images ?? [];
    const filteredImages = imagesToKeep.filter((imagePath): imagePath is string => Boolean(imagePath));
    const removedImages = (event.images ?? []).filter(
      (imagePath) => !filteredImages.includes(imagePath),
    );

    if (removedImages.length) {
      await this.deleteImagesFromDisk(removedImages);
    }

    const uploadedImages = this.mapUploadedFiles(imageFiles);

    Object.assign(event, rest);
    event.images = [...filteredImages, ...uploadedImages];
    return await this.eventRepository.save(event);
  }

  /**
   * Remove event record (soft delete)
   * @param id - Event ID
   */
  async remove(id: number): Promise<void> {
    const event = await this.findOne(id);
    const images = event.images ?? [];
    await this.eventRepository.softRemove(event);
    if (images.length) {
      await this.deleteImagesFromDisk(images);
    }
  }

  private mapUploadedFiles(files?: Express.Multer.File[]) {
    if (!files?.length) {
      return [];
    }

    return files.map((file) => getEventImagePublicPath(file.filename));
  }

  private async deleteImagesFromDisk(imagePaths: string[]) {
    for (const imagePath of imagePaths) {
      const absolutePath = resolvePublicPathToAbsolute(imagePath);
      if (!absolutePath) {
        continue;
      }

      try {
        await unlink(absolutePath);
      } catch (error: any) {
        if (error?.code !== 'ENOENT') {
          console.error(`Failed to delete image at ${absolutePath}:`, error);
        }
      }
    }
  }
}

