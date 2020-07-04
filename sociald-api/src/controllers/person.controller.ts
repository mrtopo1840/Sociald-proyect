import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
} from '@loopback/rest';
import {Person, User} from '../models';
import {PersonRepository, UserRepository} from '../repositories';
import { service } from '@loopback/core';
import { CryptingService } from '../services';

export class PersonController {
  constructor(
    @repository(PersonRepository)
    public personRepository : PersonRepository,
    @repository(UserRepository)
    public userRepository : UserRepository,
    @service(CryptingService)
    public cryptingService: CryptingService
  ) {}

  @post('/person', {
    responses: {
      '200': {
        description: 'Person model instance',
        content: {'application/json': {schema: getModelSchemaRef(Person)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            required: ['code', 'name', 'lastname', 'email', 'password']
          },
        },
      },
    })
    body: any,
  ): Promise<Person> {
    const {password, ...personBody} = body;
    const newPerson:Person = await this.personRepository.create(personBody);

    const encryptedPassword = this.cryptingService.getDoubledMd5Password(password);

    const newUserData = {
      username: newPerson.email,
      password: encryptedPassword,
      role: "person"
    }

    const newUser: Promise<User> = this.personRepository.user(newPerson.id).create(newUserData);

    return newPerson;
  }

  @get('/person/count', {
    responses: {
      '200': {
        description: 'Person model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.where(Person) where?: Where<Person>,
  ): Promise<Count> {
    return this.personRepository.count(where);
  }

  @get('/person', {
    responses: {
      '200': {
        description: 'Array of Person model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Person, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.filter(Person) filter?: Filter<Person>,
  ): Promise<Person[]> {
    return this.personRepository.find(filter);
  }

  @patch('/person', {
    responses: {
      '200': {
        description: 'Person PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Person, {partial: true}),
        },
      },
    })
    person: Person,
    @param.where(Person) where?: Where<Person>,
  ): Promise<Count> {
    return this.personRepository.updateAll(person, where);
  }

  @get('/person/{id}', {
    responses: {
      '200': {
        description: 'Person model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Person, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Person, {exclude: 'where'}) filter?: FilterExcludingWhere<Person>
  ): Promise<Person> {
    return this.personRepository.findById(id, filter);
  }

  @patch('/person/{id}', {
    responses: {
      '204': {
        description: 'Person PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Person, {partial: true}),
        },
      },
    })
    person: Person,
  ): Promise<void> {
    await this.personRepository.updateById(id, person);
  }

  @put('/person/{id}', {
    responses: {
      '204': {
        description: 'Person PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() person: Person,
  ): Promise<void> {
    await this.personRepository.replaceById(id, person);
  }

  @del('/person/{id}', {
    responses: {
      '204': {
        description: 'Person DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.personRepository.deleteById(id);
  }
}