import { resolve } from 'path'

import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'

import {
  // CfnAccount,
  DomainName,
  EndpointType,
  SecurityPolicy
} from 'aws-cdk-lib/aws-apigateway'
import {
  // ARecord,
  // CnameRecord,
  // CrossAccountZoneDelegationRecord,
  HostedZone,
  PublicHostedZone,
  // RecordTarget
} from 'aws-cdk-lib/aws-route53'
import { DnsValidatedCertificate, Certificate } from 'aws-cdk-lib/aws-certificatemanager'
import { AccountPrincipal } from 'aws-cdk-lib/aws-iam'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'

import { LambdaFunctions } from './lambda-functions'
import { CoderAPIRestApi } from './api-gateway'
import { coderAPIDashboard } from './dashboards/dashboard'
import { DynamoDB } from './dynamodb'

import { config } from 'dotenv'
config({ path: resolve(__dirname, '../.env') })

export class CoderApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const hostedZoneName = process.env.DOMAIN_NAME as string

    const currentDate = new Date()
    // const zone = new PublicHostedZone(this, 'HostedZone', {
    //   zoneName: hostedZoneName,
    //   comment: `This hosted zone is created for the Coder API ${currentDate.toISOString()}`
    // })
    
    const zone = new HostedZone(this, 'HostedZone', {
      zoneName: hostedZoneName,
      comment: `This hosted zone is created for the Coder API ${currentDate.toISOString()}`
    })
    
    zone.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY)

    // const acmCertificate = new DnsValidatedCertificate(
    //   this,
    //   'DomainCertificate',
    //   {
    //     domainName: hostedZoneName,
    //     hostedZone: zone,
    //     region: 'us-east-1'
    //   }
    // )
    const acmCertificate = Certificate.fromCertificateArn(this, 'Certificate', 'arn:aws:acm:us-east-1:594172205456:certificate/250f3052-7def-4361-825e-29b4b9630f2e');


    // acmCertificate.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY)

    const domainName = new DomainName(this, 'DomainName', {
      domainName: zone.zoneName,
      certificate: acmCertificate,
      endpointType: EndpointType.EDGE, // default is REGIONAL
      securityPolicy: SecurityPolicy.TLS_1_2
    })

    //   // configure log retention
    let accessLogRetention!: RetentionDays
    if (process.env.STAGE === 'dev') {
      accessLogRetention = RetentionDays.ONE_MONTH
    } else if (process.env.STAGE === 'prod') {
      accessLogRetention = RetentionDays.THREE_MONTHS
    }

    // // log group for monitoring api
    const coderAPILogGroup = new LogGroup(this, 'coder-API-Access-Logs', {
      logGroupName: 'coderAPIAccessLogs',
      retention: accessLogRetention,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    })

    new DynamoDB(this, {
      tableName: 'postalCode'
    })

    const coderAPI = new CoderAPIRestApi(this, 'coder-API', {
      logGroup: coderAPILogGroup,
      domainName: domainName
    })

    new LambdaFunctions(this, {
      stackName: this.stackName,
      coderAPI: coderAPI
    })

    const dashboard = new coderAPIDashboard(this, 'coderAPIDashboard', {
      restApiName: coderAPI.restApiName,
      logGroupName: coderAPILogGroup.logGroupName
    })
    
    dashboard.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY)
  }
}
