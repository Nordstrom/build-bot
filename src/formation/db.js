'use strict';

module.exports = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'Hackathon Build Bot DB Stack',
    Resources: {
        stateTable: {
            Type: 'AWS::DynamoDB::Table',
            Properties: {
                AttributeDefinitions: [
                    {
                        AttributeName: 'repo',
                        AttributeType: 'S'
                    },
                    {
                        AttributeName: 'version',
                        AttributeType: 'S'
                    }
                ],
                KeySchema: [
                    {
                        AttributeName: 'repo',
                        KeyType: 'HASH'
                    },
                    {
                        AttributeName: 'version',
                        KeyType: 'RANGE'
                    }
                ],
                ProvisionedThroughput: {
                    ReadCapacityUnits: 1,
                    WriteCapacityUnits: 1
                },
                TableName: 'build-bot-state'
            }
        }
    }
}
