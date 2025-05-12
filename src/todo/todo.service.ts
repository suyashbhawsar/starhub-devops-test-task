import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Todo, TodoDocument } from './schemas/todo.schema';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodoService {
  private readonly logger = new Logger(TodoService.name);

  constructor(@InjectModel(Todo.name) private todoModel: Model<TodoDocument>) {}

  async create(createTodoDto: CreateTodoDto): Promise<Todo> {
    const createdTodo = new this.todoModel(createTodoDto);
    const todo = await createdTodo.save();
    this.logger.log(JSON.stringify({ action: 'create', todo }));
    return todo;
  }

  async findAll(): Promise<Todo[]> {
    const todos = await this.todoModel.find().exec();
    this.logger.log(JSON.stringify({ action: 'findAll', count: todos.length }));
    return todos;
  }

  async findOne(id: string): Promise<Todo> {
    const todo = await this.todoModel.findById(id).exec();
    if (!todo) {
      this.logger.warn(JSON.stringify({ action: 'findOne', id, message: 'Not Found' }));
      throw new NotFoundException(`Todo with id ${id} not found`);
    }
    this.logger.log(JSON.stringify({ action: 'findOne', todo }));
    return todo;
  }

  async update(id: string, updateTodoDto: UpdateTodoDto): Promise<Todo> {
    const todo = await this.todoModel.findByIdAndUpdate(id, updateTodoDto, { new: true }).exec();
    if (!todo) {
      this.logger.warn(JSON.stringify({ action: 'update', id, update: updateTodoDto, message: 'Not Found' }));
      throw new NotFoundException(`Todo with id ${id} not found`);
    }
    this.logger.log(JSON.stringify({ action: 'update', todo }));
    return todo;
  }

  async remove(id: string): Promise<void> {
    const result = await this.todoModel.findByIdAndDelete(id).exec();
    if (!result) {
      this.logger.warn(JSON.stringify({ action: 'remove', id, message: 'Not Found' }));
      throw new NotFoundException(`Todo with id ${id} not found`);
    }
    this.logger.log(JSON.stringify({ action: 'remove', id }));
  }
}
