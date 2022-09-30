import { CfnOutput } from 'aws-cdk-lib'
import {
  AccessLogFormat,
  DomainName,
  EndpointType,
  IntegrationType,
  LogGroupLogDestination,
  MethodLoggingLevel,
  Resource,
  RestApi
} from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { IFunction } from 'aws-cdk-lib/aws-lambda'
import { LogGroup } from 'aws-cdk-lib/aws-logs'
import { Construct } from 'constructs'

import {
  ApiGatewayConfig,
  createResource,
  devHubMethodOptions,
  devHubMockIntegration,
  ProductConfig,
} from './api-gateway-utils'

export interface CoderAPIProperties {
  readonly logGroup: LogGroup
  readonly domainName: DomainName
}

export interface ResourcesByService {
  [key: string]: Resource[]
}

export class CoderAPIRestApi extends RestApi {
  static TAG_SERVICE = 'service'
  protected _resourcesByService: ResourcesByService

  constructor(scope: Construct, id: string, props: CoderAPIProperties) {
    const { logGroup, 
      domainName
    } = props

    super(scope, id, {
      restApiName: 'coder-api',
      description: 'This is the Central API gateway',
      endpointConfiguration: {
        types: [EndpointType.EDGE]
      },
      minimumCompressionSize: 0,
      cloudWatchRole: true,
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(logGroup),
        accessLogFormat: AccessLogFormat.jsonWithStandardFields(),
        dataTraceEnabled: true,
        loggingLevel: MethodLoggingLevel.INFO,
        metricsEnabled: true,
        throttlingBurstLimit: 1000, // Specifies the throttling burst limit. Total burst limit for the account is 5000 requests per second (rps).
        throttlingRateLimit: 2000, // Specifies the throttling rate limit. Total rate of all requests in AWS account is limited to 10,000 requests per second (rps).
        tracingEnabled: true
      }
    })

    // Domain Name API Mapping
    domainName?.addBasePathMapping(this, { basePath: 'prod' })
    
    // Redirect Page
    this.root.addMethod('ANY', devHubMockIntegration, devHubMethodOptions)

    const defaultRequestValidator = this.addRequestValidator(
      'coder-api-validator',
      {
        requestValidatorName: 'coder-api-validator',
        validateRequestParameters: true,
        validateRequestBody: true
      }
    )

    // Add v1 resources
    const v1ApiResource = this.root.addResource('v1')
    this._resourcesByService = {}
    const configFile: ApiGatewayConfig = this.node.tryGetContext(
      'api-gateway-config'
    )

    // Create config file resources
    for (const [product, productConfig] of Object.entries(configFile)) {
      const integrationData = this.integrationData(productConfig)
      for (const resource of productConfig.resources) {
        const integrationMetadata = this.integrationMetadata(
          productConfig,
          integrationData,
          resource.uri
        )

        const newResource = createResource(
          v1ApiResource,
          resource,
          defaultRequestValidator,
          integrationMetadata
        )

        if (resource.resources) {
          for (const subResource of resource.resources) {
            createResource(newResource, subResource, defaultRequestValidator, [
              productConfig.integrationType,
              `${productConfig.url}/${resource.uri}/${subResource.uri}`
            ])
          }
        }

        this._resourcesByService[product] = []
        this._resourcesByService[product].push(newResource)
      }
    }
  
    // / Outputs and Parameters
    // /////////////////////////////

    // new CfnOutput(this, 'coder-api-gw-id', {
    //   value: this.restApiId,
    //   exportName: 'coder-api-gw-id'
    // })

    // new CfnOutput(this, 'coder-api-gw-arn', {
    //   value: this.arnForExecuteApi(),
    //   exportName: 'coder-api-gw-arn'
    // })

    // new CfnOutput(this, 'coder-api-gw-name', {
    //   value: this.restApiName,
    //   exportName: 'coder-api-gw-name'
    // })
  }

  public get resourcesByService() {
    return this._resourcesByService
  }

  private integrationData(productConfig: ProductConfig): string | IFunction {
    if (productConfig.integrationType === IntegrationType.AWS_PROXY) {
      return lambda.Function.fromFunctionArn(
        this,
        'postalcode-lambda-from-arn',
        productConfig.arn as string
      )
    }

    return productConfig.url as string
  }

  private integrationMetadata(
    productConfig: ProductConfig,
    integrationData: string | IFunction,
    resourceUri: string
  ): [IntegrationType, string | IFunction] {
    return productConfig.useResourceUri
      ? [productConfig.integrationType, `${integrationData}/${resourceUri}`]
      : [productConfig.integrationType, integrationData]
  }
}
