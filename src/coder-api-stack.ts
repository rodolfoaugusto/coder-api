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
  PublicHostedZone,
  // RecordTarget
} from 'aws-cdk-lib/aws-route53'
import { DnsValidatedCertificate } from 'aws-cdk-lib/aws-certificatemanager'
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

    // const parentHostedZoneName = process.env.PARENT_HOSTED_ZONE as string
    // const mainHostedZoneName = process.env.MAIN_HOSTED_ZONE as string

    // const mainZone = new PublicHostedZone(this, 'HostedZone', {
    //   zoneName: mainHostedZoneName,
    //   comment: 'This hosted zone is created for the Coder API'
    // })

    // mainZone.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY)
    
    // const parentZone = new PublicHostedZone(this, 'MainHostedZone', {
    //   zoneName: parentHostedZoneName,
    //   comment: 'This hosted zone is created for the Coder API Proxy POC'
    // })
    
    // parentZone.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY)

    // const mainAcmCertificate = new DnsValidatedCertificate(
    //     this,
    //     'MainRegionCertificate',
    //     {
    //       domainName: mainHostedZoneName,
    //       hostedZone: mainZone,
    //       region: 'us-east-1'
    //     }
    //   )

    // const mainDomainName = new DomainName(this, 'MainDomainName', {
    //     domainName: mainZone.zoneName,
    //     certificate: mainAcmCertificate,
    //     endpointType: EndpointType.EDGE, // default is REGIONAL
    //     securityPolicy: SecurityPolicy.TLS_1_2
    //   })

    // const acmCertificate = new DnsValidatedCertificate(
    //   this,
    //   'CrossRegionCertificate',
    //   {
    //     domainName: parentHostedZoneName,
    //     hostedZone: parentZone,
    //     region: process.env.CDK_DEFAULT_REGION
    //   }
    // )

    // const domainName = new DomainName(this, 'DomainName', {
    //   domainName: parentZone.zoneName,
    //   certificate: acmCertificate,
    //   endpointType: EndpointType.EDGE, // default is REGIONAL
    //   securityPolicy: SecurityPolicy.TLS_1_2
    // })

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
      // domainName: domainName,
      // mainDomainName: mainDomainName
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
