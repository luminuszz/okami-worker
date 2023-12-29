import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Consumer } from 'sqs-consumer';
import { GetQueueUrlCommand, SQSClient } from '@aws-sdk/client-sqs';
import * as process from 'process';

let nestApp: INestApplication;
let sqsClient: SQSClient;

export const sqsGetSqsClientInstance = () => {
  if (!sqsClient) {
    sqsClient = new SQSClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_KEY_ACCESS,
      },
    });
  }

  return sqsClient;
};

export const getAppInstance = async () => {
  if (!nestApp) {
    nestApp = await NestFactory.create(AppModule);
  }

  return nestApp;
};

export const createConsumer = (
  queueUrl: string,
  handler: (value: any) => Promise<void>,
) => {
  const sqsClient = sqsGetSqsClientInstance();

  return Consumer.create({
    queueUrl,
    sqs: sqsClient,
    handleMessage: ({ Body }) => handler(JSON.parse(Body)),
  });
};

export const getQueueUrl = (queueName: string) => {
  return `${process.env.SQS_ENDPOINT}/${queueName}`;
};
