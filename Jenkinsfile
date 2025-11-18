// Jenkinsfile
pipeline {
    agent any

    environment {
        // FINAL FIX: Using TCP port exposed by Docker Desktop to bypass
        // persistent Unix socket permission issues in WSL 2.
        DOCKER_HOST = 'tcp://localhost:2375'
        
        DOCKER_HUB_USER = 'chhuzaifamayo'
        // Uses the commit short hash for unique image tagging
        IMAGE_TAG = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
    }

    stages {
        stage('Build & Push Server Image') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                        sh "docker login -u ${DOCKER_USERNAME} -p ${DOCKER_PASSWORD}"
                        
                        sh "docker build -t ${DOCKER_HUB_USER}/collab-server:${IMAGE_TAG} ./server"
                        sh "docker push ${DOCKER_HUB_USER}/collab-server:${IMAGE_TAG}"
                        
                        sh "docker tag ${DOCKER_HUB_USER}/collab-server:${IMAGE_TAG} ${DOCKER_HUB_USER}/collab-server:latest"
                        sh "docker push ${DOCKER_HUB_USER}/collab-server:latest"
                    }
                }
            }
        }

        stage('Build & Push Client Image') {
            steps {
                script {
                    sh "docker build -t ${DOCKER_HUB_USER}/collab-client:${IMAGE_TAG} ./client"
                    sh "docker push ${DOCKER_HUB_USER}/collab-client:${IMAGE_TAG}"
                    
                    sh "docker tag ${DOCKER_HUB_USER}/collab-client:${IMAGE_TAG} ${DOCKER_HUB_USER}/collab-client:latest"
                    sh "docker push ${DOCKER_HUB_USER}/collab-client:latest"
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo "Applying Kubernetes manifests with new image tag: ${IMAGE_TAG}" 
                // Assumes kubectl is installed and configured to connect to Docker Desktop's Kubernetes
                sh "kubectl apply -f k8s/"
            }
        }
        
        stage('Test Deployment (Manual/Basic Check)') {
             steps {
                 // Check if the deployments rolled out successfully
                 sh "kubectl rollout status deployment/collab-server-deployment"
                 sh "kubectl rollout status deployment/collab-client-deployment"
             }
        }
    }
}