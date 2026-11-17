pipeline {
  agent any

  tools { nodejs 'NodeJS-20' }   // name must match Manage Jenkins -> Tools -> NodeJS installations

  options {
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
    timeout(time: 15, unit: 'MINUTES')
  }

  environment {
    WEB_HOST = 'ubuntu@172.31.4.98'      // web server PRIVATE IP
    WEB_URL  = 'http://172.31.4.98'      // used by the Verify stage
    APP_DIR  = '/opt/shop'
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Install & Test') {
      steps {
        sh 'node -v && npm -v'
        sh 'npm ci'
        sh 'npm test'
      }
    }

    stage('Package') {
      steps {
        sh 'tar czf shop.tar.gz --exclude=node_modules --exclude=.git --exclude=shop.tar.gz .'
      }
    }

    stage('Deploy') {
      steps {
        sshagent(['web-server-ssh']) {
          sh '''
            scp -o StrictHostKeyChecking=no shop.tar.gz $WEB_HOST:/tmp/shop.tar.gz
            ssh -o StrictHostKeyChecking=no $WEB_HOST "
              set -e
              find $APP_DIR -mindepth 1 -maxdepth 1 ! -name node_modules -exec rm -rf {} + &&
              tar xzf /tmp/shop.tar.gz -C $APP_DIR &&
              cd $APP_DIR && npm ci --omit=dev &&
              sudo systemctl restart shop &&
              rm -f /tmp/shop.tar.gz"
          '''
        }
      }
    }

    stage('Verify') {
      steps {
        retry(5) {
          sh 'sleep 3 && curl -fsS $WEB_URL/health'
        }
      }
    }
  }

  post {
    success { echo "Deployed build #${env.BUILD_NUMBER} to ${env.WEB_URL}" }
    failure { echo 'Build or deploy failed. Check the Console Output of this build.' }
    always  { cleanWs() }
  }
}
