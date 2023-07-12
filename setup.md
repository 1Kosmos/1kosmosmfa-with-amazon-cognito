**AWS account with the follows service permissions:**

- Lambda
- Cognito-Idp
- Nodejs and NPM

You can find an example of IAM policy under aws/awsPolicy.json

Other Variables needed (Need to create OAuth Application in BlockID tenant):

- 1KOSMOS_CLIENTE_ID // OAuth Client ID
- 1KOSMOS_TENANT_DNS // Tenant DNS
- 1KOSMOS_COMMUNITY // Community Name
- 1KOSMOS_SECRET_ID // OAuth Client Secret Id

## Solution Steps 

### **Clone the project:**

```
$ gitclone https://github.com/1Kosmos/1kosmosmfa-with-amazon-cognito.git
$ cd 1kosmosmfa-with-amazon-cognito
```

### **Manually Create the AWS Resources: User Pool, App Client, Lmbda Functions, AWS Key/Secret and Lambda Triggers:**
How to generate access key and access secret : https://docs.aws.amazon.com/powershell/latest/userguide/pstools-appendix-sign-up.html

Create User Pool: 
Login into aws and search for cognito in search panel.

![image](https://github.com/1Kosmos/1kosmosmfa-with-amazon-cognito/assets/92369226/c73429ce-a00f-479b-b761-19c74028db89)

![image](https://github.com/1Kosmos/1kosmosmfa-with-amazon-cognito/assets/92369226/c8d671dc-bf12-46ab-80f7-6acd201621ce)

![image](https://github.com/1Kosmos/1kosmosmfa-with-amazon-cognito/assets/92369226/ab527f6e-7123-4b72-9867-fe0d55e95680)

![image](https://github.com/1Kosmos/1kosmosmfa-with-amazon-cognito/assets/92369226/86f4ff73-61bb-4ad5-9b63-97ea424d0606)

![image](https://github.com/1Kosmos/1kosmosmfa-with-amazon-cognito/assets/92369226/9d224ce9-7b80-465d-b117-521d158a770a)

![image](https://github.com/1Kosmos/1kosmosmfa-with-amazon-cognito/assets/92369226/6e204771-951d-439c-b91d-7921f59aec51)

![image](https://github.com/1Kosmos/1kosmosmfa-with-amazon-cognito/assets/92369226/4f0aab6f-382c-441a-a0f5-ed83e13eb757)

![image](https://github.com/1Kosmos/1kosmosmfa-with-amazon-cognito/assets/92369226/95904cfc-ca3b-41bc-ae58-5178366481c8)

![image](https://github.com/1Kosmos/1kosmosmfa-with-amazon-cognito/assets/92369226/52f98811-ebb4-4bd6-aedc-1d22084ebcb9)

![image](https://github.com/1Kosmos/1kosmosmfa-with-amazon-cognito/assets/92369226/f2e1c641-93b5-416a-8728-83a432c794c5)

After successfully creation of UserPool, open it and copy/note the user_pool_id

Creation of App Client (Get app_client_id): 

- Click on the App Integration tab.

- Scroll to bottom, click on the Create App Client button under the App client list tab.

- Copy the Client ID from the list. If not seeing the all client, create the one.

![image](https://github.com/1Kosmos/1kosmosmfa-with-amazon-cognito/assets/92369226/8275cea1-842d-4b8e-8f3f-3709e7102a7e)

Create Lambda Functions: 

- FInd aws folder which has three lambda funtions js files, just need to create same one on AWS.

- Name of the lambda functions should be the same as of the file name with the js extention.

- After create lambda function cope the and paste the code there and click on DEPLOY.

- Do same steps for all three functions i.e. CreateAuthChallenge.js,DefineAuthChallenge.js and VerifyAuthChallenge.js 

```
Environment variables will not work here in manuall integration, Check for CreateAUthChallenge and VerifyAuthChallenge files, replace the valuse with the correct ones. (process.env.)
```

![image](https://github.com/1Kosmos/1kosmosmfa-with-amazon-cognito/assets/92369226/5cb0a6d9-5795-4009-bd43-0c7f3c9e56b0)

Create Lambda Triggers: 
- Come back into the user pool, open it and click on User Pool Properties tab

- From here add the lambda triggers for the respective lambda funtion.

![image](https://github.com/1Kosmos/1kosmosmfa-with-amazon-cognito/assets/92369226/0931c02f-549d-46b9-8980-c993604fc77c)

### **Update and run the application**
Edit the file public/view-client.js to use the new user-pool that you just created.

```
var poolData = {
  UserPoolId: "user_pool_id",// you will get it under the user pool
  ClientId: "app_client_id",// you will get it under user pool -> app client
};
```

Install and run the application

```
$ npm install
$ node server.js
```

## Register and Sign In using the cognito stepup authentication:

- Register the user with the information displayed. Note the username/email should be the same with the adminx db user for the specified tenant/community.

- Sign in again withe the same user and follow the step up journey.

- On successfull journey, you will get the Id_Token and Access_Token in response
