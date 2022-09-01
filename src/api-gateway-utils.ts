/* eslint-disable @typescript-eslint/indent */
/* eslint-disable prettier/prettier */
import {
  AuthorizationType,
  Cors,
  HttpIntegration,
  IntegrationType,
  LambdaIntegration,
  MethodOptions,
  MockIntegration,
  PassthroughBehavior,
  RequestValidator,
  Resource,
  ResourceOptions
} from 'aws-cdk-lib/aws-apigateway'
import { IFunction } from 'aws-cdk-lib/aws-lambda'

export interface ApiGatewayConfig {
  [product: string]: ProductConfig
}

export interface ProductConfig {
  url?: string
  arn?: string
  resources: ApiGatewayResourceConfig[]
  integrationType: IntegrationType
  useResourceUri?: boolean
}

export interface ApiGatewayResourceConfig {
  uri: string
  proxy: boolean
  useValidator?: boolean
  resourceOptions?: ResourceOptions
  anyMethodOptions?: MethodOptions
  proxyMethodOptions?: MethodOptions
  resources?: ApiGatewayResourceConfig[]
}

export const lambdaIntegration = (bssLambda: IFunction) =>
  new LambdaIntegration(bssLambda, {
    proxy: true
  })

export const httpIntegration = (
  url: string,
  httpMethod?: string
): HttpIntegration =>
  new HttpIntegration(url, {
    httpMethod: httpMethod || 'ANY',
    options: {
      passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
      credentialsPassthrough: true
    }
  })

export const proxyHttpIntegration = (
  url: string,
  httpMethod?: string
): HttpIntegration =>
  new HttpIntegration(url + '/{proxy}', {
    httpMethod: httpMethod || 'ANY',
    proxy: true,
    options: {
      passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
      credentialsPassthrough: true,
      requestParameters: {
        'integration.request.path.proxy': 'method.request.path.proxy'
      }
    }
  })

export const defaultResourceOptions: ResourceOptions = {
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS
  }
}

export const defaultAnyHttpMethodOptions: MethodOptions = {
  authorizationType: AuthorizationType.NONE
}

export const defaultProxyHttpMethodOptions: MethodOptions = {
  ...defaultAnyHttpMethodOptions,
  requestParameters: {
    'method.request.path.proxy': true
  }
}

export const productIntegration = (
  integrationMetadata: [IntegrationType, string | IFunction],
  proxy?: boolean
): HttpIntegration | LambdaIntegration => {
  if (integrationMetadata[0] === IntegrationType.AWS_PROXY) {
    return lambdaIntegration(integrationMetadata[1] as IFunction)
  }

  if (integrationMetadata[0] === IntegrationType.HTTP && proxy) {
    return proxyHttpIntegration(integrationMetadata[1] as string)
  }

  return httpIntegration(integrationMetadata[1] as string)
}

export const methodOptions = (
  options: MethodOptions,
  useValidator?: boolean,
  requestValidator?: RequestValidator
): MethodOptions => (useValidator ? { ...options, requestValidator } : options)

export function createResource(
  baseResource: Resource,
  resourceConfig: ApiGatewayResourceConfig,
  requestValidator: RequestValidator,
  integrationMetadata: [IntegrationType, string | IFunction]
): Resource {
  const newResource = baseResource.addResource(
    resourceConfig.uri,
    resourceConfig.resourceOptions || defaultResourceOptions
  )

  if (!resourceConfig.resources?.length) {
    newResource.addMethod(
      'ANY',
      productIntegration(integrationMetadata),
      methodOptions(
        resourceConfig.anyMethodOptions || defaultAnyHttpMethodOptions,
        resourceConfig.useValidator,
        requestValidator
      )
    )
  }

  if (resourceConfig.proxy) {
    newResource
      .addProxy({
        anyMethod: false,
        defaultMethodOptions: methodOptions(
          resourceConfig.proxyMethodOptions || defaultProxyHttpMethodOptions,
          false
        )
      })
      .addMethod(
        'ANY',
        productIntegration(integrationMetadata, true),
        methodOptions(
          resourceConfig.proxyMethodOptions || defaultProxyHttpMethodOptions,
          resourceConfig.useValidator,
          requestValidator
        )
      )
  }

  return newResource
}

export const devHubMockIntegration = new MockIntegration({
  passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
  credentialsPassthrough: true,
  requestTemplates: {
    'application/json': `
       #set($context.requestOverride.path.body = $input.body)
      {
        "statusCode": 301
      }`
  },
  integrationResponses: [
    {
      statusCode: '301',
      responseParameters: {
        'method.response.header.Location': `'${process.env.DEVELOPER_HUB_ENDPOINT as string}'`
      }
    }
  ]
})

export const devHubMethodOptions: MethodOptions = {
  authorizationType: AuthorizationType.NONE,
  methodResponses: [
    {
      statusCode: '301',
      responseParameters: {
        'method.response.header.Location': true
      }
    }
  ]
}
