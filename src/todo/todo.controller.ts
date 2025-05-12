import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { TodoService } from './todo.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { Logger } from '@nestjs/common';

@Controller('todos')
export class TodoController {
  private readonly logger = new Logger(TodoController.name);

  constructor(private readonly todoService: TodoService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTodoDto: CreateTodoDto) {
    const todo = await this.todoService.create(createTodoDto);
    this.logger.log(JSON.stringify({ action: 'controller_create', todo }));
    return todo;
  }

  @Get()
  async findAll() {
    const todos = await this.todoService.findAll();
    this.logger.log(JSON.stringify({ action: 'controller_findAll', count: todos.length }));
    return todos;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const todo = await this.todoService.findOne(id);
    this.logger.log(JSON.stringify({ action: 'controller_findOne', id }));
    return todo;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateTodoDto: UpdateTodoDto) {
    const todo = await this.todoService.update(id, updateTodoDto);
    this.logger.log(JSON.stringify({ action: 'controller_update', id }));
    return todo;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.todoService.remove(id);
    this.logger.log(JSON.stringify({ action: 'controller_remove', id }));
  }
}
