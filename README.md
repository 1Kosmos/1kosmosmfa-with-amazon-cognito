# One Kosmos MFA integration with Amazon Cognito

This project is a demonestration of how to integrate One Kosmos Multi-Factor Authentication with Amazon Cognito user pools.

# Requirements

- AWS account with the follows service permissions:
  - S3
  - Lambda
  - Cognito-Idp
  - ClourFormation
- Nodejs and NPM

You can find an example of IAM policy under `aws/awsPolicy.json`

# Deployment steps

###### Auth Flow Lambdas

All the lambdas needs to be available in a S3 bucket before the next steps.

This project already provide all the lambdas uploaded in a S3 bucket hosted in AWS Region: `us-east-1` so if you wanna to reuse these lambdas all the others services
necessarily needs to be deployed in the same region `us-east-1`.

In case you desire to have your services in a different aws region please upload the lambdas in your desired S3 bucket and then update the lambdas code uri in file `aws/UserPoolTemplate.yaml`

```
CodeUri: {S3_URI}
```

###### Clone the project

```sh
$ git clone https://github.com/1Kosmos/1kosmosmfa-with-amazon-cognito.git
$ cd 1kosmosmfa-with-amazon-cognito
```

###### Create AWS resources

Create AWS resaources by running the CLI command below, replace 1KOSMOS_CLIENTE_ID, 1KOSMOS_TENANT_DNS, 1KOSMOS_COMMUNITY, and 1KOSMOS_SECRET_ID with the correct values from your 1kosmos account. **Note that creating these resources might incur cost in your account.**

This command will create Cognito resources, lambda functions that will be used to drive custom authentication flow and it will also create a secret in secrets manager to store Kosmos keys

```sh
$ aws cloudformation create-stack --stack-name one-kosmos-mfa-cognito --template-body file://aws/UserPoolTemplate.yaml --capabilities CAPABILITY_AUTO_EXPAND CAPABILITY_IAM CAPABILITY_NAMED_IAM --parameters ParameterKey=kosmosClienteId,ParameterValue={1KOSMOS_CLIENTE_ID} ParameterKey=kosmosTenant,ParameterValue={1KOSMOS_TENANT_DNS} ParameterKey=kosmosCommunity,ParameterValue={1KOSMOS_COMMUNITY} ParameterKey=kosmosSecretId,ParameterValue={1KOSMOS_SECRET_ID}

```

Wait for the stack to be created successfully and then get the user-pool-id and app-client-id from outputs section. you can do this from CloudFromation console or using describe-stacks command

```sh
$ aws cloudformation describe-stacks --stack-name one-kosmos-mfa-cognito
```

###### Update and run the application

Edit the file public/view-client.js to use the new user-pool that you just created.

```javascript
var poolData = {
  UserPoolId: "user_pool_id",
  ClientId: "app_client_id",
};
```

Install and run the application

```sh
$ npm install
$ node server.js
```

## Notes about implementation

###### User registration

Registration is performed by collecting user data in UI and making a call to `signUp()` in /public/view-client.js
This call creates a user in Cognito, an automated email will be sent to verify email address and a prompt will be displayed to collect verification pin.

###### User authentication

Authentication starts by collecting username and password then making a call to `signIn()` method in /public/view-client.js
`signIn()` starts a custom authentication flow with secure remote password (SRP). Cognito then responds with a custom challenge which is used to initialize and display 1Kosmos MFA iframe.

Notice the call to `cognitoUser.authenticateUser(authenticationDetails, authCallBack);` the custom challenge will be sent to authCallBack function and this is where Kosmos SDK is initialized and used as below:

```javascript
$("#mfa-div").html('<div id="mfa-iframe" class="iframe_container"></div>');
const iframe = $("#mfa-iframe");
BIDStepup.stepup(
  iframe,
  challengeParameters.tenant,
  challengeParameters.community,
  challengeParameters.kosmos_clientId,
  username,
  challengeParameters.state,
  challengeParameters.acr,
  mfa_callback
);
```

This will render One Kosmos iframe to the user with instructions to either setup their MFA preferences, if this is the first sign-in attempt, or initiate MFA according to saved settings.

###### Define Auth Challenge

This lamda function is triggered when authentication flow is CUSTOM_AUTH to evaluate the authentication progress and decide what is the next step. For reference, the code of this lambda trigger is under aws/DefineAuthChallenge.js

Define auth challenge will go through the logic below to decide next challenge:

```javascript
/**
 * 1- if user doesn't exist, throw exception
 * 2- if CUSTOM_CHALLENGE answer is correct, authentication successful
 * 3- if PASSWORD_VERIFIER challenge answer is correct, return custom challenge. This is usually the 2nd step in SRP authentication
 * 4- if challenge name is SRP_A, return PASSWORD_VERIFIER challenge. This is usually the first step in SRP authentication
 * 5- if 5 attempts with no correct answer, fail authentication
 * 6- default is to respond with CUSTOM_CHALLENGE --> password-less authentication
 * */
```

###### Create Auth Challenge

This lambda function is triggered when the next step (returned from define auth challenge) is CUSTOM_CHALLENGE. For reference, the code of this lambda trigger is under aws/CreateAuthChallenge.js

This function will load One Kosmos variables and provide these variables to the front end be able to follow the step up flow.

###### Verify Auth Challenge

This lambda will be triggered when challenge response is passed on from client to Cognito service, this is done throug the call `cognitoUser.sendCustomChallengeAnswer(data , authCallBack);`
challenge response includes the autheticated code response generated from One Kosmos MFA, this response will be validated exchanging the code by the id_token from One Kosmos. For reference, the code of this lambda trigger is under aws/VerifyAuthChallenge.js

## Implementation details
Let’s walk through the end-to-end flow of integrating BlockID MFA with Amazon Cognito using a custom authentication flow. 
Abovedemo project provides deployment steps and sample code to create a working demo in your environment.

#### Create and configure a user pool
The first step is to create the AWS resources needed for the demo. You can do that by deploying the AWS CloudFormation stack as described in the demo project.
A few implementation details to be aware of:
- The template creates an Amazon Cognito user pool, application client, and AWS Lambda triggers that are used for the custom authentication.
- The template also accepts tenantDNS, communityName, oauth clientID and oauth clientSecret as inputs. 
> For security, the parameters are masked in the AWS CloudFormation console. These parameters are stored in a secret in AWS Secrets Manager with a resource policy that allows relevant Lambda functions read access to that secret.
- Above params are loaded from the secrets manager at the initialization of create OIDC request and during exchange of code grant for an `id_token`.

Once the cloudformation is setup, you will need to get the user-pool-id and the app-client-id from the outputs and provide the same in the `public/view-client.js`

## Authentication Flow

<img src="https://www.websequencediagrams.com/cgi-bin/cdraw?lz=dGl0bGUgMUtvc21vcyBTdGV1cCB3LyBBbWF6b24gQ29nbml0bwpwYXJ0aWNpcGFudAAjCU1GQQALDVVzZXIAARByIGFnZW50ADMNAE0HXG51c2VyIHBvb2wAUg1EZWZpbmUgQXV0aFxuQ2hhbGxlbmdlADQOcmVhdAAFHlZlcmlmeQA1EQpVc2VyLT4AgRAKOiBzaWduLWluABUFAIEoBi0-AIEREjogSW5pdGlhdGUgYXV0aAoAgTMSLT4AgSQWOiBQcm9ncmVzcyBzbyBmYXIKAIFMFgBgFkNVU1RPTV9DSEFMTEVOR0UAZBUAgXoWOgCCIAhjAII8CQCCIxYAgVoWAIQLCE9JREMgcmVxdWVzdACBYhUAgkEMAIMmCgCCQwwAhCcLOiBEaXNwbGF5AIRqCWlmcmFtZSBmb3Igc3RlcC11cAoAhFcLAIMmBjogdgCDSgZ1c2VyAIM9BwBIDWFuc3dlADgJAIFnCwA6EQCDbwhpbnZva2UgY2FsbGJhY2sgYW5kIGNvZGUtZ3JhbnQAg20hcmVzcG9uc2VUb0F1dGgAhR4JXG4AhkIIAEELAIQYFACFChY6IGV4Y2hhbmdlAIEHBSB3aXRoIGlkX3Rva2VuCgCFPhYAgQIeIG9rAIRXVQCGNgxUb2tlbnMgb3IgbmV4dACEZAsK&s=default"/>

- In your application, the user is presented with a sign-in UI that performs the first factor authentication with username / password against Cognito user-pool

- After the first factor, the define <a href="https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-define-auth-challenge.html">auth challenge</a> Lambda trigger will return CUSTOM_CHALLENGE and this will move control to the <a href="https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-create-auth-challenge.html">create auth challenge</a> trigger.

- The create auth challenge Lambda trigger creates a BlockID OIDC request params using tenantId, communityName, clientId. This is also where you can specify ACR claims to configure what kind of step up options should be available to a user. Here is a sample code of what create auth challenge should look like https://github.com/1Kosmos/1kosmosmfa-with-amazon-cognito/blob/main/aws/CreateAuthChallenge.js

- The client initializes the BlockID Web library with the OIDC and displays BlockID MFA in an iframe to request a second factor from the user. To initialize the BlockID library, tenantId, communityName, OIDC clientId, acr claim, username and a callback function to invoke after MFA step is completed by the user. This is done on the client side as follows:
```
BIDStepup.stepup(
      iframe,
      challengeParameters.tenant,
      challengeParameters.community,
      challengeParameters.kosmos_clientId,
      username,
      challengeParameters.state,
      challengeParameters.acr,
      mfa_callback
    );
```
- Through the BlockID iframe, the user can select their MFA preferences and respond to an MFA challenge. After successful MFA setup, an OIDC code-grant response from the web SDK will be returned to the client and passed to the `mfa_callback` function that was provided in `BIDStepup.stepup` call

- The client sends the BlockID code-grant response to the Amazon Cognito service as a challenge response.

- Amazon Cognito sends the response to the verify auth challenge Lambda trigger, which uses BlockID OIDC clientId and secret to verify the response.

- Validation results and current state are passed once again to the define auth challenge Lambda trigger. If the user response is valid, then the BlockID MFA challenge is successful. You can then decide to introduce additional challenges to the user or issue tokens and complete the authentication process.



## Try it out
To try this ahead of any production integration you can test functionality with 1Kosmos Developer Portal.
- Register for developer account: https://developer.1kosmos.com/devportal/register

- We have pre-setup a ready to use OIDC Service Provider you can use for this trial
```
DNS: blockid-trial.1kosmos.net
Community Name: devx
Client ID: af29b87614ba0e1e8952b4cc1bf72f95
Secret: d741894404f769117b551d61df7b77f60062a5041ba961c577936960242b4a80
```
- Follow steps to setup your Amazon Cognito Authentication workflow

> When you register Amazon Cognito user, please remember to use the same email address registered above on 1Kosmos Dev Portal
> You can request a dedicated trial in which you will be able to link your Amazon Cognito User Pool with BlockID platform (<i>more information below</i>)

BlockID Step-up will be integrated into the sign-in flow as a custom challenge. 
To do that, you need to generate an OIDC request (using the above SDK) and load BlockID MFA UI in an iframe. When the challenge is answered by the user, a code grant is returned to your web application and can be sent to Amazon Cognito for verification. 
If the response is valid then the MFA challenge is successful.



