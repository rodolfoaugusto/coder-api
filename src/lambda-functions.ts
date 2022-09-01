import { Duration } from 'aws-cdk-lib'
// import { Schedule } from 'aws-cdk-lib/aws-applicationautoscaling'
import { 
  ManagedPolicy,
  // Role,
  // ServicePrincipal
} from 'aws-cdk-lib/aws-iam'
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import { Construct } from 'constructs'

import { CoderAPIRestApi } from './api-gateway'

export interface LambdaProps {
  readonly stackName: string
  readonly coderAPI: CoderAPIRestApi
}

export class LambdaFunctions {
  lambdaAuthorizer: NodejsFunction

  constructor(scope: Construct, props: LambdaProps) {
    const { stackName } = props

    // const assumeRolesList = process.env.PRODUCT_ACCOUNT_ASSUME_ROLES || '*'
    // const allowedUserGroups = process.env.ALLOWED_USER_GROUPS || ''
    // const maxProvisionedConcurrency = Number(
    //   process.env.MAX_PROVISIONED_CONCURRENCY || '2'
    // )

    // configure log retention
    let lambdaLogRetention!: RetentionDays
    if (process.env.STAGE === 'dev') {
      lambdaLogRetention = RetentionDays.ONE_MONTH
    } else if (process.env.STAGE === 'prod') {
      lambdaLogRetention = RetentionDays.THREE_MONTHS
    }

    this.lambdaAuthorizer = new NodejsFunction(
      scope,
      'postalCodeFunction',
      {
        entry: './src/lambda/postalcode.ts',
        // environment: {
        //   ALLOWED_USER_GROUPS: allowedUserGroups,
        //   PRODUCT_ACCOUNT_ASSUME_ROLES: assumeRolesList,
        //   LOG_LEVEL: 'INFO'
        // },
        functionName: stackName + '-postalCodeFunction',
        description: `Generated on: ${new Date().toISOString()}`,
        handler: 'handler',
        logRetention: lambdaLogRetention,
        runtime: Runtime.NODEJS_14_X,
        timeout: Duration.seconds(10),
        tracing: Tracing.ACTIVE
      }
    )

    this.lambdaAuthorizer.role?.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess')
    )
    // add alias to the function current version
    // const authAlias = this.lambdaAuthorizer.currentVersion.addAlias('deployed')
    // add autoscaling target
    // const authScalingTarget = authAlias.addAutoScaling({
    //   minCapacity: 0,
    //   maxCapacity: maxProvisionedConcurrency + 0.1 * maxProvisionedConcurrency
    // })
    // // add schedule for autoscaling
    // authScalingTarget.scaleOnSchedule('AuthScaleUpInTheMorning', {
    //   schedule: Schedule.cron({ hour: '08', minute: '00' }),
    //   minCapacity: maxProvisionedConcurrency, // this is the new minimum capacity required
    //   maxCapacity: maxProvisionedConcurrency // the new maximum capacity is maxProvisionedCOncurrency
    // })

    // authScalingTarget.scaleOnSchedule('AuthScaleDownAtNight', {
    //   schedule: Schedule.cron({ hour: '20', minute: '0' }),
    //   minCapacity: 0,
    //   maxCapacity: 0 // this is the new maximum capacity required
    // })
  }
}
