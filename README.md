<h1 align="center">AWS CloudFormation Stack Cleanup λ</h1>

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=xavier-thomas_aws-cfn-stack-cleanup&metric=alert_status)](https://sonarcloud.io/dashboard?id=xavier-thomas_aws-cfn-stack-cleanup)
![Tests](https://github.com/xavier-thomas/aws-cfn-stack-cleanup/workflows/Tests/badge.svg)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=xavier-thomas_aws-cfn-stack-cleanup&metric=coverage)](https://sonarcloud.io/dashboard?id=xavier-thomas_aws-cfn-stack-cleanup)
[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fxavier-thomas%2Faws-cfn-stack-cleanup%2Fmaster)](https://dashboard.stryker-mutator.io/reports/github.com/xavier-thomas/aws-cfn-stack-cleanup/master)
[![Dependency Status](https://david-dm.org/xavier-thomas/aws-cfn-stack-cleanup.svg)](https://david-dm.org/xavier-thomas/aws-cfn-stack-cleanup)


<h4 align="center">An AWS Lambda that can be invoked as a custom resource from an AWS CloudFormation stack to clean up any left over stack resources such as S3 buckets and Log Groups</h4>

<p align="center">
    <a href="#overview">Overview</a> |
    <a href="#getting-started">Getting Started</a> |
    <a href="#deploying-the-lambda">Deploying the Lambda</a> |
    <a href="#permissions">Permissions</a> |
    <a href="#invoking-the-lambda">Invoking the Lambda</a> |
    <a href="#contributing">Contributing</a> |
  	<a href="#authors">Authors</a> |
  	<a href="#licence">Licence</a>
</p>

## Overview

Cloudformation does not always cleanly delete the resources that it's created.
The most notable example is with S3 Buckets created by Cloudformation. If these bucket's contain objects, they cannot be deleted during Cloudformation stack deletion.

Similarly, there are other resources like, Log Groups or sub-stacks deployed by a CodePipeline that need to be cleaned up.

This lambda is meant to be invoked as a Cloudformation custom resource that when passed resource names, will clean up those resources during stack deletion.

Any other event other than stack deletion (such as stack creation or stack update) are ignored.

Currently this lambda only supports Emptying and Deletion of S3 buckets, however it's planned to support other resource types in the future.

## Getting Started
### Deploying the Lambda

The lambda needs to be deployed into the same account as your invoking cloudformation stack. It can be deployed through the console from [here](https://eu-west-1.console.aws.amazon.com/lambda/home?region=eu-west-1#/create/app?applicationId=arn:aws:serverlessrepo:us-east-1:673103718481:applications/Cfn-Stack-Cleanup)
or it can be deployed from Cloudformation.

In order to deploy from CloudFormation, use the following as an example for your template.

```YAML

Description: Deploys Cfn-Stack-Cleanup Lambda function from Serverless Application Repo
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31


Resources:
  CfnStackCleanup:
    Type: AWS::Serverless::Application
    Properties:
      Location:
        ApplicationId: arn:aws:serverlessrepo:us-east-1:673103718481:applications/Cfn-Stack-Cleanup
      SemanticVersion: 1.1.0
      # Optional Parameter to control the export name of the nested stack
      Parameters:
        ExportPrefix: !Ref AWS::StackName

```
#### Manual Deployment - Not Recommended
If you choose not to use the lambda from the Servlerless Repo, you can also manually build and deploy the lambda into your own account.
The following methods are not recommended due to the additional complexity this adds, use at your own discression.

```bash
# Build the Lambda
yarn build
```
Once built locally you can use one of several of the following methods.
* [SAM Deploy](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-deploy.html)
* [SAM Package](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-package.html) or [Cloudformation Package](https://docs.aws.amazon.com/cli/latest/reference/cloudformation/package.html) along with manual deployment of the resulting packaged template.
* Build and deploy the lambda from an AWS CodePipeline / CodeBuild that's watching this repository
* Zip the lambda and deploy it manually.


### Permissions
All Lambda permissions are created during deployment. Currently these are permissions to list s3 objects, delete s3 objects and delete s3 buckets.

```yaml
    - Effect: Allow
      Action:
        - s3:DeleteBucket
        - s3:DeleteObjects
        - s3:List*
      Resource: '*'
```


### Invoking the Lambda

```yaml
Resources:
  StackCleanup:
    Type: Custom::StackCleanup
    Properties:
      ServiceToken:
        Fn::ImportValue: !Sub ${ExportPrefix}StackCleanupLambdaArn
      BucketNames:
      # (Optional) Array of bucket names you want to delete
        - ...
        - ...
```
#### Example Stack with Cleanup

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Example Stack with Cleanup

Parameters:
  EnableLogging:
    Description: Enable/Disable logging
    AllowedValues:
      - Enable
      - Disable
    Default: Disable
    Type: String

  Cleanup:
    AllowedValues:
      - Enable
      - Disable
    Default: Disable
    Description: Auto Cleanup this stack's resources during deletion to simplify maintenance during development. Do Not Enable on Production
    Type: String

  ExportPrefix:
    Type: String
    Description: (Optional) The Prefix name used when deploying the cfn-stack-cleanup lambda
    Default: ""

Conditions:
  cEnableCleanup: !Equals [!Ref Cleanup, 'Enable']
  cEnableLogging: !Equals [!Ref EnableLogging, 'Enable']


Resources:
  AutoCleanup:
    Type: Custom::AutoCleanup
    Condition: cEnableCleanup # You may not always want to clean up resources. For instance on Production environments
    Properties:
      ServiceToken:
        Fn::ImportValue: !Sub ${ExportPrefix}StackCleanupLambdaArn
      BucketNames:
        - !Ref 'ArtifactBucket'
        - !Ref 'ApplicationBucket'
        - !If
          - cEnableLogging
          - !Ref 'LogsBucket'
          - !Ref 'AWS::NoValue'

  ApplicationBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain #This will prevent Cloudformation from throwing an error when trying to delete the bucket
    Properties:
      BucketName: !Sub '${DomainName}'
      AccessControl: 'PublicRead'
      WebsiteConfiguration:
        IndexDocument: 'index.html'

  ArtifactBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain #This will prevent Cloudformation from throwing an error when trying to delete the bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-artifacts'

  LogsBucket:
    Type: AWS::S3::Bucket
    Condition: cEnableLogging
    DeletionPolicy: Retain #This will prevent Cloudformation from throwing an error when trying to delete the bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-logs'

```

## Contributing
### Prerequisites
To clone and contribute to this application, you'll need Git, Node.js and [Yarn](https://yarnpkg.com/) installed. You can also use an alternative package manager, such as NPM if you prefer!

### Installing
From your favourite command line tool, run the following:
```bash
# Clone the repo
git clone git@github.com:xavier-thomas/aws-cfn-stack-cleanup.git

## or if you use HTTPS instead of SSH
git clone https://github.com/xavier-thomas/aws-cfn-stack-cleanup.git

# Install dependencies
yarn
```

### Running tests
From your favourite command line tool, run the following:
```bash
# Run the unit tests
yarn test
```

### Running Mutation Tests
This project uses [Stryker](https://stryker-mutator.io/) for mutation testing.
From your favourite command line tool, run the following:
```bash
# Mutate and test the unit tests
yarn mutate
```

### Linting & code formatting
From your favourite command line tool, run the following:
```bash
# Run the linter
yarn lint
```

### Raising Issues
We welcome anyone to contribute to this project.
Before raising a PR, reach out to us by [raising an issue](https://github.com/xavier-thomas/aws-cfn-stack-cleanup/issues) or by emailing the author.
There is a helpful issue template that can be used as a guideline to report issues or suggest new features.

### Raising PRs

Once you are satisfied with your work, you can raise a [Pull Request](https://github.com/xavier-thomas/aws-cfn-stack-cleanup/pulls).
The project's maintainers will need to approve this before it can be merged in and atleast 1 approving review is needed before your work can be merged in.

`Note`: Pre-Commit hooks are in place to perform audit, lint fix and run tests before you can commit. To ensure that unverified changes are not merged into master, when a new PR is raised on GitHub, the github actions workflow automatically runs the unit tests, mutation tests, [Sonar](https://sonarcloud.io/) and [cfn-lint](https://github.com/aws-cloudformation/cfn-python-lint) to validate the PR. Without successful checks, your pull request will be blocked from being merged as a safeguard.


## Authors
**[Xavier Thomas](https://github.com/xavier-thomas)**
**[Matthew Farrow](https://github.com/mfarrow701)**

## Licence
**[3-Clause BSD](./LICENCE)**
