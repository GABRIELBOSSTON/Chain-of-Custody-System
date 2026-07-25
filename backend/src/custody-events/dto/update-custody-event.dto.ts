import { PartialType } from '@nestjs/mapped-types';
import { CreateCustodyEventDto } from './create-custody-event.dto';

export class UpdateCustodyEventDto extends PartialType(CreateCustodyEventDto) {}
