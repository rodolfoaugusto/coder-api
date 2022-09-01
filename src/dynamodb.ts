import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs'

export interface DynamoDBProps {
  readonly tableName: string
}

export class DynamoDB {
  constructor(scope: Construct, props: DynamoDBProps) {
    const { tableName } = props

    new Table(scope, tableName, {
        partitionKey: { name: `${tableName}Id`, type: AttributeType.STRING },
        tableName,
        removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code
    })
  }
}