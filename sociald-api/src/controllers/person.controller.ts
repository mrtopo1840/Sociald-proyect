import {service} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  put,
  requestBody,
} from '@loopback/rest';
import {authenticate} from '@loopback/authentication';
import {genSalt, hash} from 'bcryptjs';

import {
  Person,
  EmailNotification,
  CredentialsRequestBody,
  PersonMixedUserRequestBody
} from '../models';
import {PersonRepository, UserRepository} from '../repositories';
import {
  CryptingService,
  NotificationService,
  JWTService,
  MyUserService,
  Credentials
} from '../services';


export class PersonController {
  constructor(
    @repository(PersonRepository)
    public personRepository: PersonRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @service(CryptingService)
    public cryptingService: CryptingService,
    @service(MyUserService)
    public userService: MyUserService,
    @service(JWTService)
    public jwtService: JWTService,
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
    @requestBody(PersonMixedUserRequestBody)
    body: any,
  ): Promise<any> {
    // Separe the password of the rest of the body
    const {email, password, ...personBody} = body;
    const role = 'person';

    // Create the person
    const savedPerson: Person = await this.personRepository.create(personBody);

    // Encrypt the password two times using our Crypting Service
    const encryptedPassword = await hash(password, await genSalt());

    // Prepare the data of the user with the password encrypted
    const newUserData = {
      email: email,
      password: encryptedPassword,
      username: savedPerson.name,
      role: role,
    };

    const savedUser = await this.personRepository.user(savedPerson.id).create(newUserData);

    await this.userRepository.userCredentials(savedUser.id).create({
      password: encryptedPassword,
      email: email,
      role: role
    });

    let emailData: EmailNotification = new EmailNotification({
      subject: 'Welcome to SocialD',
      body: 'Bienvenid@ a la nueva pagina de reclutamiento de programadores',
      text: `Hola <strong>${savedPerson.name}</strong> espereamos que te guste nuestra pagina recuerda que tu contrseña es ${password} `,
      to: email,
    });

    let sendEmail: boolean = await new NotificationService().EmailNotification(
      emailData,
    );

    if (sendEmail) {
      console.log('Message send!');
    }

    return {savedPerson, savedUser};
  }

  @post('/person/login', {
    responses: {
      '200': {
        description: 'Token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async login(
    @requestBody(CredentialsRequestBody) credentials: Credentials,
  ): Promise<{token: string}> {
    // ensure the user exists, and the password is correct
    const user = await this.userService.verifyCredentials(credentials);
    // convert a User object into a UserProfile object (reduced set of properties)
    const userProfile = this.userService.convertToUserProfile(user);

    // create a JSON Web Token based on the user profile
    const token = await this.jwtService.generateToken(userProfile);
    return {token};
  }

  @get('/person/count', {
    responses: {
      '200': {
        description: 'Person model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(@param.where(Person) where?: Where<Person>): Promise<Count> {
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
  async find(@param.filter(Person) filter?: Filter<Person>): Promise<Person[]> {
    return this.personRepository.find(filter);
  }

  @authenticate('socialdjwt')
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
    @param.filter(Person, {exclude: 'where'})
    filter?: FilterExcludingWhere<Person>,
  ): Promise<Person> {
    return this.personRepository.findById(id, filter);
  }

  @authenticate('socialdjwt')
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

  @authenticate('socialdjwt')
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

  @authenticate('socialdjwt')
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
