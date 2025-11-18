// Jenkinsfile
pipeline {
    agent any

    environment {
        // *** CRITICAL FIX FOR WSL 2 DOCKER DESKTOP CONNECTION ***
        DOCKER_HOST = 'unix:///mnt/wsl/docker-desktop/cli.sock'
        
        // Docker Hub Username
        DOCKER_HUB_USER = 'chhuzaifamayo'
        // Set a tag based on the commit short hash for unique image versions
        IMAGE_TAG = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
    }

    stages {
        stage('Build & Push Server Image') {
            steps {
                script {
                    // Docker login requires credentials
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
                    // Client image can be pushed without re-logging in
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