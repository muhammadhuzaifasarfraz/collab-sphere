// Jenkinsfile
pipeline {
    agent any

    environment {
        // REMOVED DOCKER_HOST: Using Docker Context for reliable WSL connection.
        DOCKER_HUB_USER = 'chhuzaifamayo'
        IMAGE_TAG = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
    }

    stages {
        stage('Build & Push Server Image') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                        // All docker commands MUST use the context flag
                        sh "docker --context desktop-linux login -u ${DOCKER_USERNAME} -p ${DOCKER_PASSWORD}"
                        
                        sh "docker --context desktop-linux build -t ${DOCKER_HUB_USER}/collab-server:${IMAGE_TAG} ./server"
                        sh "docker --context desktop-linux push ${DOCKER_HUB_USER}/collab-server:${IMAGE_TAG}"
                        
                        sh "docker --context desktop-linux tag ${DOCKER_HUB_USER}/collab-server:${IMAGE_TAG} ${DOCKER_HUB_USER}/collab-server:latest"
                        sh "docker --context desktop-linux push ${DOCKER_HUB_USER}/collab-server:latest"
                    }
                }
            }
        }

        stage('Build & Push Client Image') {
            steps {
                script {
                    // All docker commands MUST use the context flag
                    sh "docker --context desktop-linux build -t ${DOCKER_HUB_USER}/collab-client:${IMAGE_TAG} ./client"
                    sh "docker --context desktop-linux push ${DOCKER_HUB_USER}/collab-client:${IMAGE_TAG}"
                    
                    sh "docker --context desktop-linux tag ${DOCKER_HUB_USER}/collab-client:${IMAGE_TAG} ${DOCKER_HUB_USER}/collab-client:latest"
                    sh "docker --context desktop-linux push ${DOCKER_HUB_USER}/collab-client:latest"
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo "Applying Kubernetes manifests with new image tag: ${IMAGE_TAG}" 
                sh "kubectl apply -f k8s/"
            }
        }
        
        stage('Test Deployment (Manual/Basic Check)') {
             steps {
                 sh "kubectl rollout status deployment/collab-server-deployment"
                 sh "kubectl rollout status deployment/collab-client-deployment"
             }
        }
    }
}