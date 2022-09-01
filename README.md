# Coder API
The Coder API is a centralized API to connect multiple tools for open-source projects using public API's.

# API Tools
- Postal Codes (Brazil)

### API Structure (Postal Code Service)

| HTTP METHOD | POST              | GET                        | PUT               | DELETE      |
| ----------- | ----------------- | -------------------------- | ----------------- | ----------- |
| CRUD OP     | CREATE            | READ                       | UPDATE            | DELETE      |
| /postalcode/:country/:value     | Ok (200) | Error (404) | Error (404)       | Error (404) |

## Infrastructure Architecture
The infrastructure overview can be found at 
![Infrastructure](assets/architecture.svg?raw=true)
* [Architecture](https://app.diagrams.net/?splash=0&libs=aws4#G15-NriNevQ1Ynqq3z40MbPPlnfHQBlt4I)

## AWS Resources Deployed

* AWS Route53 Hosted Zone
* AWS API Gateway
* AWS DynamoDB

## Getting Started

### Requirements

* NodeJS (13/14 recommended)
* NPM
* [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/home.html)

### Development

```
git clone git@github.com:rodolfoaugusto/coder-api.git
cd coder-api
npm run build
npm run test
npm run deploy
```
 
* You have to assume to appropriate AWS IAM Role by using the awscli before tryng to deploy the resources defined by the Stack.
 