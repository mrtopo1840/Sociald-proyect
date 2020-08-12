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
  HttpErrors,
} from '@loopback/rest';
import {PublicationRequest, EmailNotification} from '../models';
import {PublicationRequestRepository, CompanyRepository, PublicationRepository, UserRepository} from '../repositories';
import { service } from '@loopback/core';
import { NotificationService } from '../services';

export class PublicationRequestController {
  constructor(
    @repository(PublicationRequestRepository)
    public publicationRequestRepository : PublicationRequestRepository,
    @repository(CompanyRepository)
    public companyRepository : CompanyRepository,
    @repository(PublicationRepository)
    public publicationRepository : PublicationRepository,
    @repository(UserRepository)
    public userRepository : UserRepository,
    @service(NotificationService)
    protected notificationService : NotificationService,
  ) {}

  @post('/publication-request', {
    responses: {
      '200': {
        description: 'PublicationRequest model instance',
        content: {'application/json': {schema: getModelSchemaRef(PublicationRequest)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PublicationRequest, {
            title: 'NewPublicationRequest',
            exclude: ['id'],
          }),
        },
      },
    })
    publicationRequest: Omit<PublicationRequest, 'id'>,
  ): Promise<PublicationRequest> {
    let publication = await this.publicationRepository.findById(publicationRequest.publicationId);
    let company = await this.companyRepository.findById(publicationRequest.companyId);
    let user = await this.userRepository.findOne({
      where: {
        personId: publication.personId,
      }
    });

    if(await this.publicationRequestRepository.find({
      where: {
        companyId: publicationRequest.companyId,
        publicationId: publicationRequest.publicationId,
      }
    })){
      throw new HttpErrors[400]('Ya has contactado esta publicacion');
    }

    let mail = new EmailNotification({
      to: user?.email,
      subject: `${company.name} quiere contratar tus servicios!`,
      body: `${company.name} quiere contratar tus servicios!`,
      text: publicationRequest.message,
    });

    let mailResponse = await this.notificationService.EmailNotification(mail);

    if(mailResponse) {
      console.log("Email send");
    }else{
      console.error("No se pudo enviar el email");
    }

    return this.publicationRequestRepository.create(publicationRequest);
  }

  @get('/publication-request/count', {
    responses: {
      '200': {
        description: 'PublicationRequest model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.where(PublicationRequest) where?: Where<PublicationRequest>,
  ): Promise<Count> {
    return this.publicationRequestRepository.count(where);
  }

  @get('/publication-request', {
    responses: {
      '200': {
        description: 'Array of PublicationRequest model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(PublicationRequest, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.filter(PublicationRequest) filter?: Filter<PublicationRequest>,
  ): Promise<PublicationRequest[]> {
    return this.publicationRequestRepository.find(filter);
  }

  @patch('/publication-request', {
    responses: {
      '200': {
        description: 'PublicationRequest PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PublicationRequest, {partial: true}),
        },
      },
    })
    publicationRequest: PublicationRequest,
    @param.where(PublicationRequest) where?: Where<PublicationRequest>,
  ): Promise<Count> {
    return this.publicationRequestRepository.updateAll(publicationRequest, where);
  }

  @get('/publication-request/{id}', {
    responses: {
      '200': {
        description: 'PublicationRequest model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(PublicationRequest, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(PublicationRequest, {exclude: 'where'}) filter?: FilterExcludingWhere<PublicationRequest>
  ): Promise<PublicationRequest> {
    return this.publicationRequestRepository.findById(id, filter);
  }

  @patch('/publication-request/{id}', {
    responses: {
      '204': {
        description: 'PublicationRequest PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PublicationRequest, {partial: true}),
        },
      },
    })
    publicationRequest: PublicationRequest,
  ): Promise<void> {
    await this.publicationRequestRepository.updateById(id, publicationRequest);
  }

  @put('/publication-request/{id}', {
    responses: {
      '204': {
        description: 'PublicationRequest PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() publicationRequest: PublicationRequest,
  ): Promise<void> {
    await this.publicationRequestRepository.replaceById(id, publicationRequest);
  }

  @del('/publication-request/{id}', {
    responses: {
      '204': {
        description: 'PublicationRequest DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.publicationRequestRepository.deleteById(id);
  }
}
