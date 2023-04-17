pipeline {
  agent any
  environment {
    IMAGE_REPO_NAME = "dev-helix-api"
    AWS_ACCOUNT_ID = "968270538251"
    AWS_DEFAULT_REGION = "ap-southeast-1"
  }

  stages {
    stage('Pre Build') { 
      steps {
        script {
        sh 'echo Prebuild command'
        sh 'echo IMAGE_REPO_NAME $IMAGE_REPO_NAME'
        sh 'echo AWS_ACCOUNT_ID $AWS_ACCOUNT_ID'
        sh 'echo AWS_DEFAULT_REGION $AWS_DEFAULT_REGION'
        sh 'echo Logging in to Amazon ECR...'
        sh "aws ecr get-login-password --region ${AWS_DEFAULT_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com"
        }
      }
    }
    stage('Build') { 
      steps {
        script {
        sh 'echo Start build ...'
        env.COMMIT_HASH = sh(script:'git rev-parse --short=8 HEAD', returnStdout: true).trim()
        env.REPOSITORY_URI= sh(script: 'echo $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME', returnStdout: true).trim()
        sh 'echo $COMMIT_HASH'
        sh 'echo Build started on `date`'
        sh 'echo Building the Docker image...'
        sh 'printenv > .env'
        sh 'docker build -t $REPOSITORY_URI:latest .'
        sh 'docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$COMMIT_HASH'
        sh 'echo Build completed on `date`'
        sh 'echo Pushing the Docker image...'
        sh "docker push ${REPOSITORY_URI}:latest"
        sh "docker push ${REPOSITORY_URI}:${COMMIT_HASH}"  
        }
      }
    }
    stage('Deploy') { 
      steps {
        script {
          env.COMMIT_HASH = sh(script:'git rev-parse --short=8 HEAD', returnStdout: true).trim()
          sh 'if [ -d /opt/helix-infra ]; then rm -Rf /opt/helix-infra; fi'
          sh "git clone --single-branch --branch dev https://${INFRA_ACCESS_TOKEN}@github.com/helilabs/helix-infra.git /opt/helix-infra"
          sh 'sed -i "s/latest/${COMMIT_HASH}/g" /opt/helix-infra/modules/ecs-api/ecs-with-scale.tf'
          sh 'terraform -chdir=/opt/helix-infra/ init'
          sh 'terraform -chdir=/opt/helix-infra/ apply -auto-approve'
        }
      }
    }
  }
}
