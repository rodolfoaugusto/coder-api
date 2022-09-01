import { APIGatewayProxyEvent, APIGatewayProxyCallback, Context } from 'aws-lambda'

export const handler = async (event: APIGatewayProxyEvent, context: Context, callback: APIGatewayProxyCallback): Promise<any> => {
    const response = {
        'statusCode': 200,
        'headers': {
        'Content-Type': 'application/json',
        },
        'body': JSON.stringify({
            'key3': 'xxxxx',
            'key2': 'zzzzz',
            'key1': 'uyyyy'
        }),
        'isBase64Encoded': false
    }
    callback(null, response)
}